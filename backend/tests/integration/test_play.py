import pytest

# Integração: rotas de uma jogada (obter, editar, apagar) + schema + SQLAlchemy + SQLite em memória.


@pytest.fixture
def jogada(client, time, cena_valida):
    """Jogada em rascunho do `time`, criada pela API."""
    resposta = client.post(f"/teams/{time['id']}/plays", headers=chave(time),
                           json={"titulo": "Saída de bola", "descricao": "Pela esquerda", "cena": cena_valida})
    assert resposta.status_code == 201
    return resposta.json()


@pytest.fixture
def outro_time(client):
    return client.post("/teams", json={"nome": "Outro", "modalidade": "futebol"}).json()


def chave(time: dict) -> dict:
    return {"X-Chave-Treinador": time["chave_treinador"]}


def test_obtem_a_jogada_completa_com_a_cena(client, time, jogada, cena_valida):
    resposta = client.get(f"/plays/{jogada['id']}", headers=chave(time))

    assert resposta.status_code == 200
    assert resposta.json() == jogada
    assert resposta.json()["cena_json"]["acoes"] == cena_valida["acoes"]


def test_publica_a_jogada_sem_mexer_no_resto(client, time, jogada):
    resposta = client.patch(f"/plays/{jogada['id']}", json={"status": "publicada"}, headers=chave(time))

    assert resposta.status_code == 200
    salva = client.get(f"/plays/{jogada['id']}", headers=chave(time)).json()
    assert salva["status"] == "publicada"
    assert (salva["titulo"], salva["descricao"], salva["cena_json"]) == (
        jogada["titulo"], jogada["descricao"], jogada["cena_json"])


def test_edita_titulo_e_apaga_a_descricao(client, time, jogada):
    client.patch(f"/plays/{jogada['id']}", json={"titulo": "Saída curta", "descricao": None}, headers=chave(time))

    salva = client.get(f"/plays/{jogada['id']}", headers=chave(time)).json()
    assert (salva["titulo"], salva["descricao"], salva["status"]) == ("Saída curta", None, "rascunho")


@pytest.mark.parametrize("corpo", [{"titulo": ""}, {"status": "arquivada"}])
def test_rejeita_edicao_invalida_e_mantem_a_jogada(client, time, jogada, corpo):
    resposta = client.patch(f"/plays/{jogada['id']}", json=corpo, headers=chave(time))

    assert resposta.status_code == 422
    assert client.get(f"/plays/{jogada['id']}", headers=chave(time)).json() == jogada


def test_apaga_a_jogada(client, time, jogada):
    resposta = client.delete(f"/plays/{jogada['id']}", headers=chave(time))

    assert resposta.status_code == 204
    assert client.get(f"/plays/{jogada['id']}", headers=chave(time)).status_code == 404
    assert client.get(f"/teams/{time['id']}/plays", headers=chave(time)).json() == []


def test_jogada_inexistente_responde_404(client, time):
    for metodo in ("get", "patch", "delete"):
        corpo = {"json": {"status": "publicada"}} if metodo == "patch" else {}
        assert getattr(client, metodo)("/plays/999", headers=chave(time), **corpo).status_code == 404


@pytest.mark.parametrize("dono_da_chave", ["errada", "atleta", "outro_time"])
def test_so_o_treinador_do_time_obtem_edita_ou_apaga(client, time, jogada, outro_time, dono_da_chave):
    chaves = {"errada": "chave-errada", "atleta": time["chave_atleta"], "outro_time": outro_time["chave_treinador"]}
    headers = {"X-Chave-Treinador": chaves[dono_da_chave]}
    url = f"/plays/{jogada['id']}"

    assert client.get(url, headers=headers).status_code == 404
    assert client.patch(url, json={"status": "publicada"}, headers=headers).status_code == 404
    assert client.delete(url, headers=headers).status_code == 404
    # Nada mudou: a jogada continua lá, em rascunho.
    assert client.get(url, headers=chave(time)).json() == jogada


def test_exige_o_header_da_chave_do_treinador(client, jogada):
    url = f"/plays/{jogada['id']}"

    assert client.get(url).status_code == 422
    assert client.patch(url, json={"status": "publicada"}).status_code == 422
    assert client.delete(url).status_code == 422
