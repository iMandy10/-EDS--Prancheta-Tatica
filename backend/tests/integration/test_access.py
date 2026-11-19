import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app

# Fixtures locais deste arquivo: banco SQLite em memória, limpo a cada teste.
# Quando o conftest.py compartilhado existir, estas podem ser trocadas pelas dele.


@pytest.fixture
def client():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Sessao = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    def get_db_de_teste():
        db = Sessao()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = get_db_de_teste
    with TestClient(app) as cliente:
        yield cliente
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)


CENA = {
    "quadra": "basquete",
    "pecas": [
        {"id": "A1", "tipo": "jogador_time_a", "x": 330, "y": 250},
        {"id": "bola", "tipo": "bola", "x": 343, "y": 263, "posse": "A1"},
    ],
    "acoes": [{"id": "a1", "tipo": "drible", "origem": "A1", "destino": {"x": 500, "y": 250}, "ordem": 1}],
}


def criar_time(client, nome="Furacão"):
    resposta = client.post("/teams", json={"nome": nome, "modalidade": "basquete"})
    assert resposta.status_code == 201
    return resposta.json()


def criar_jogada(client, time, titulo, status):
    resposta = client.post(
        f"/teams/{time['id']}/plays",
        json={"titulo": titulo, "status": status, "cena": CENA},
        headers={"X-Chave-Treinador": time["chave_treinador"]},
    )
    assert resposta.status_code == 201
    return resposta.json()


def publicadas(client, team_id, chave):
    return client.get(f"/teams/{team_id}/plays/published", headers={"X-Chave-Atleta": chave})


# GET /teams/access/{chave_atleta}


def test_entra_com_a_chave_do_atleta_e_recebe_so_id_nome_e_modalidade(client):
    time = criar_time(client)

    resposta = client.get(f"/teams/access/{time['chave_atleta']}")

    assert resposta.status_code == 200
    assert resposta.json() == {"id": time["id"], "nome": "Furacão", "modalidade": "basquete"}


@pytest.mark.parametrize("chave", ["chave-que-nao-existe", "chave_treinador"])
def test_recusa_chave_inexistente_e_a_chave_do_treinador(client, chave):
    time = criar_time(client)

    resposta = client.get(f"/teams/access/{time.get(chave, chave)}")

    assert resposta.status_code == 404
    assert resposta.json()["detail"] == "Chave de atleta inválida"


# GET /teams/{team_id}/plays/published


def test_lista_so_as_publicadas_da_mais_recente_para_a_mais_antiga(client):
    time = criar_time(client)
    antiga = criar_jogada(client, time, "Antiga", "rascunho")
    criar_jogada(client, time, "Nova", "publicada")
    criar_jogada(client, time, "Rascunho", "rascunho")
    # Publicar depois atualiza o updated_at: a "Antiga" passa a ser a mais recente.
    client.patch(
        f"/plays/{antiga['id']}", json={"status": "publicada"}, headers={"X-Chave-Treinador": time["chave_treinador"]}
    )

    resposta = publicadas(client, time["id"], time["chave_atleta"])

    assert resposta.status_code == 200
    assert [jogada["titulo"] for jogada in resposta.json()] == ["Antiga", "Nova"]
    assert "cena_json" not in resposta.json()[0]


def test_lista_vazia_quando_nada_foi_publicado(client):
    time = criar_time(client)
    criar_jogada(client, time, "Rascunho", "rascunho")

    assert publicadas(client, time["id"], time["chave_atleta"]).json() == []


def test_nao_mostra_jogadas_publicadas_de_outro_time(client):
    meu_time = criar_time(client, "Meu")
    outro_time = criar_time(client, "Outro")
    criar_jogada(client, outro_time, "Do outro", "publicada")

    assert publicadas(client, meu_time["id"], meu_time["chave_atleta"]).json() == []
    assert publicadas(client, outro_time["id"], meu_time["chave_atleta"]).status_code == 404


@pytest.mark.parametrize("chave", ["chave-errada", "chave_treinador"])
def test_recusa_a_lista_com_chave_errada_ou_a_do_treinador(client, chave):
    time = criar_time(client)
    criar_jogada(client, time, "Publicada", "publicada")

    resposta = publicadas(client, time["id"], time.get(chave, chave))

    assert resposta.status_code == 404


def test_recusa_a_lista_de_time_inexistente_e_sem_header(client):
    time = criar_time(client)

    assert publicadas(client, 999, time["chave_atleta"]).status_code == 404
    assert client.get(f"/teams/{time['id']}/plays/published").status_code == 422


# GET /teams/{team_id}/plays/published/{play_id}


def test_abre_uma_jogada_publicada_com_a_cena(client):
    time = criar_time(client)
    jogada = criar_jogada(client, time, "Pick and roll", "publicada")

    resposta = client.get(
        f"/teams/{time['id']}/plays/published/{jogada['id']}", headers={"X-Chave-Atleta": time["chave_atleta"]}
    )

    assert resposta.status_code == 200
    assert resposta.json()["titulo"] == "Pick and roll"
    assert resposta.json()["cena_json"]["acoes"][0]["tipo"] == "drible"


def test_rascunho_nao_abre_para_o_atleta_nem_sabendo_o_id(client):
    time = criar_time(client)
    rascunho = criar_jogada(client, time, "Segredo", "rascunho")

    resposta = client.get(
        f"/teams/{time['id']}/plays/published/{rascunho['id']}", headers={"X-Chave-Atleta": time["chave_atleta"]}
    )

    assert resposta.status_code == 404


def test_jogada_despublicada_deixa_de_abrir_e_some_da_lista(client):
    time = criar_time(client)
    jogada = criar_jogada(client, time, "Pick and roll", "publicada")

    client.patch(
        f"/plays/{jogada['id']}", json={"status": "rascunho"}, headers={"X-Chave-Treinador": time["chave_treinador"]}
    )

    url = f"/teams/{time['id']}/plays/published/{jogada['id']}"
    assert client.get(url, headers={"X-Chave-Atleta": time["chave_atleta"]}).status_code == 404
    assert publicadas(client, time["id"], time["chave_atleta"]).json() == []


def test_nao_abre_jogada_de_outro_time(client):
    meu_time = criar_time(client, "Meu")
    outro_time = criar_time(client, "Outro")
    jogada = criar_jogada(client, outro_time, "Do outro", "publicada")
    cabecalho = {"X-Chave-Atleta": meu_time["chave_atleta"]}

    # Nem pelo id do meu time, nem pelo id do outro time com a minha chave.
    assert client.get(f"/teams/{meu_time['id']}/plays/published/{jogada['id']}", headers=cabecalho).status_code == 404
    assert client.get(f"/teams/{outro_time['id']}/plays/published/{jogada['id']}", headers=cabecalho).status_code == 404


def test_nao_abre_a_propria_jogada_por_uma_url_com_o_id_de_outro_time(client):
    meu_time = criar_time(client, "Meu")
    outro_time = criar_time(client, "Outro")
    minha_jogada = criar_jogada(client, meu_time, "Minha", "publicada")

    resposta = client.get(
        f"/teams/{outro_time['id']}/plays/published/{minha_jogada['id']}",
        headers={"X-Chave-Atleta": meu_time["chave_atleta"]},
    )

    assert resposta.status_code == 404
