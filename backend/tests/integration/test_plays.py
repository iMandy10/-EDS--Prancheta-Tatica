from datetime import datetime

# Integração: rota + schema + SQLAlchemy + SQLite em memória (fixtures em tests/conftest.py).


def chave(time: dict) -> dict:
    return {"X-Chave-Treinador": time["chave_treinador"]}


def criar_jogada(client, time, cena, **campos):
    resposta = client.post(f"/teams/{time['id']}/plays", json={"titulo": "Saída de bola", "cena": cena, **campos},
                           headers=chave(time))
    assert resposta.status_code == 201
    return resposta.json()


def listar(client, time) -> list[dict]:
    resposta = client.get(f"/teams/{time['id']}/plays", headers=chave(time))
    assert resposta.status_code == 200
    return resposta.json()


def test_cria_jogada_em_rascunho_e_guarda_a_cena(client, time, cena_valida):
    jogada = criar_jogada(client, time, cena_valida, descricao="Pela esquerda")

    assert jogada["team_id"] == time["id"]
    assert (jogada["titulo"], jogada["descricao"], jogada["status"]) == ("Saída de bola", "Pela esquerda", "rascunho")
    assert jogada["cena_json"]["pecas"] == [{**p, "posse": None} for p in cena_valida["pecas"]]
    assert jogada["cena_json"]["acoes"] == cena_valida["acoes"]
    assert jogada["cena_json"]["visualizacao"] == "completa"


def test_cria_jogada_ja_publicada(client, time, cena_valida):
    assert criar_jogada(client, time, cena_valida, status="publicada")["status"] == "publicada"


def test_jogada_criada_aparece_na_lista_do_time_sem_a_cena(client, time, cena_valida):
    jogada = criar_jogada(client, time, cena_valida)

    [resumo] = listar(client, time)
    assert resumo["id"] == jogada["id"]
    assert "cena_json" not in resumo


def esperar_o_relogio_andar():
    # O relógio do Windows avança em saltos de vários ms: sem isso, duas jogadas teriam o mesmo horário.
    inicio = datetime.utcnow()
    while datetime.utcnow() == inicio:
        pass


def test_lista_a_jogada_alterada_por_ultimo_primeiro(client, time, cena_valida):
    antiga = criar_jogada(client, time, cena_valida, titulo="Antiga")
    esperar_o_relogio_andar()
    criar_jogada(client, time, cena_valida, titulo="Nova")
    assert [j["titulo"] for j in listar(client, time)] == ["Nova", "Antiga"]

    esperar_o_relogio_andar()
    client.patch(f"/plays/{antiga['id']}", json={"status": "publicada"}, headers=chave(time))
    assert [j["titulo"] for j in listar(client, time)] == ["Antiga", "Nova"]


def test_lista_so_as_jogadas_do_proprio_time(client, time, cena_valida):
    outro = client.post("/teams", json={"nome": "Outro", "modalidade": "futebol"}).json()
    criar_jogada(client, outro, cena_valida, titulo="Do outro time")

    assert listar(client, time) == []


def test_nao_cria_nem_lista_com_chave_errada_ou_do_atleta(client, time, cena_valida):
    for errada in ("chave-errada", time["chave_atleta"]):
        headers = {"X-Chave-Treinador": errada}
        criar = client.post(f"/teams/{time['id']}/plays", json={"titulo": "X", "cena": cena_valida}, headers=headers)
        assert criar.status_code == 404
        assert client.get(f"/teams/{time['id']}/plays", headers=headers).status_code == 404

    assert listar(client, time) == []


def test_responde_404_para_time_inexistente(client, time, cena_valida):
    resposta = client.post("/teams/999/plays", json={"titulo": "X", "cena": cena_valida}, headers=chave(time))

    assert resposta.status_code == 404


def test_exige_o_header_da_chave_do_treinador(client, time, cena_valida):
    assert client.post(f"/teams/{time['id']}/plays", json={"titulo": "X", "cena": cena_valida}).status_code == 422
    assert client.get(f"/teams/{time['id']}/plays").status_code == 422


def test_rejeita_titulo_vazio_e_cena_invalida_sem_salvar_nada(client, time, cena_valida):
    duas_acoes = [{**cena_valida["acoes"][0], "id": f"a{n}"} for n in (1, 2)]
    cena_invalida = {**cena_valida, "acoes": duas_acoes}

    for corpo in ({"titulo": "", "cena": cena_valida}, {"titulo": "X", "cena": cena_invalida}):
        resposta = client.post(f"/teams/{time['id']}/plays", json=corpo, headers=chave(time))
        assert resposta.status_code == 422

    assert listar(client, time) == []
