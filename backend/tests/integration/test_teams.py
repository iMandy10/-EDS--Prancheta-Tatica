from datetime import datetime


def criar_time(client, nome="Furacão", modalidade="futebol"):
    return client.post("/teams", json={"nome": nome, "modalidade": modalidade})


def campos_com_erro(resposta) -> list[list]:
    return [erro["loc"] for erro in resposta.json()["detail"]]


# POST /teams


def test_cria_time_de_futebol_com_todos_os_campos(client):
    resposta = criar_time(client)

    assert resposta.status_code == 201
    time = resposta.json()
    assert time["nome"] == "Furacão"
    assert time["modalidade"] == "futebol"
    assert isinstance(time["id"], int)
    assert time["chave_treinador"]
    assert time["chave_atleta"]
    datetime.fromisoformat(time["created_at"])  # falha se a data não vier no formato ISO


def test_cria_time_de_basquete(client):
    resposta = criar_time(client, modalidade="basquete")

    assert resposta.status_code == 201
    assert resposta.json()["modalidade"] == "basquete"


def test_cria_time_e_gera_duas_chaves_diferentes(client):
    time = criar_time(client).json()

    assert time["chave_treinador"] != time["chave_atleta"]


def test_dois_times_nunca_recebem_as_mesmas_chaves(client):
    time1 = criar_time(client, nome="Time 1").json()
    time2 = criar_time(client, nome="Time 2").json()

    chaves = {time1["chave_treinador"], time1["chave_atleta"], time2["chave_treinador"], time2["chave_atleta"]}
    assert len(chaves) == 4


def test_time_criado_fica_salvo_no_banco(client):
    criado = criar_time(client).json()

    resposta = client.get(f"/teams/{criado['chave_treinador']}")

    assert resposta.status_code == 200
    assert resposta.json() == criado


def test_rejeita_nome_vazio(client):
    resposta = criar_time(client, nome="")

    assert resposta.status_code == 422
    assert campos_com_erro(resposta) == [["body", "nome"]]


def test_rejeita_modalidade_inexistente(client):
    resposta = criar_time(client, modalidade="volei")

    assert resposta.status_code == 422
    assert campos_com_erro(resposta) == [["body", "modalidade"]]


def test_rejeita_pedido_sem_modalidade(client):
    resposta = client.post("/teams", json={"nome": "Furacão"})

    assert resposta.status_code == 422
    assert campos_com_erro(resposta) == [["body", "modalidade"]]
