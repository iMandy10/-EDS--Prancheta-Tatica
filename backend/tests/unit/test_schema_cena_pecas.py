import pytest
from pydantic import ValidationError

from app.schemas.cena import Cena


def cena_futebol(**mudancas) -> dict:
    """Cena de futebol válida, sem ações; `mudancas` troca ou acrescenta campos."""
    cena = {
        "quadra": "futebol",
        "pecas": [
            {"id": "A1", "tipo": "jogador_time_a", "x": 100, "y": 200},
            {"id": "B1", "tipo": "jogador_time_b", "x": 300, "y": 200},
            {"id": "bola", "tipo": "bola", "x": 120, "y": 200},
        ],
    }
    cena.update(mudancas)
    return cena


def campos_com_erro(erro: ValidationError) -> list[tuple]:
    return [e["loc"] for e in erro.errors()]


def test_aceita_cena_com_jogadores_dos_dois_times_e_bola():
    cena = Cena.model_validate(cena_futebol())

    assert cena.quadra == "futebol"
    assert [(p.id, p.tipo, p.x, p.y) for p in cena.pecas] == [
        ("A1", "jogador_time_a", 100, 200),
        ("B1", "jogador_time_b", 300, 200),
        ("bola", "bola", 120, 200),
    ]
    assert cena.acoes == []


def test_usa_visualizacao_completa_quando_nao_informada():
    assert Cena.model_validate(cena_futebol()).visualizacao == "completa"


def test_aceita_visualizacao_de_meia_quadra():
    assert Cena.model_validate(cena_futebol(visualizacao="meia_quadra")).visualizacao == "meia_quadra"


def test_rejeita_visualizacao_inexistente():
    with pytest.raises(ValidationError) as erro:
        Cena.model_validate(cena_futebol(visualizacao="zoom"))

    assert campos_com_erro(erro.value) == [("visualizacao",)]


def test_rejeita_quadra_inexistente():
    with pytest.raises(ValidationError) as erro:
        Cena.model_validate(cena_futebol(quadra="volei"))

    assert campos_com_erro(erro.value) == [("quadra",)]


def test_rejeita_tipo_de_peca_inexistente():
    pecas = [{"id": "G1", "tipo": "goleiro", "x": 10, "y": 200}]

    with pytest.raises(ValidationError) as erro:
        Cena.model_validate(cena_futebol(pecas=pecas))

    assert campos_com_erro(erro.value) == [("pecas", 0, "tipo")]


def test_rejeita_peca_sem_coordenada_x():
    pecas = [{"id": "A1", "tipo": "jogador_time_a", "y": 200}]

    with pytest.raises(ValidationError) as erro:
        Cena.model_validate(cena_futebol(pecas=pecas))

    assert campos_com_erro(erro.value) == [("pecas", 0, "x")]


def test_rejeita_coordenada_que_nao_e_numero():
    pecas = [{"id": "A1", "tipo": "jogador_time_a", "x": 100, "y": "abc"}]

    with pytest.raises(ValidationError) as erro:
        Cena.model_validate(cena_futebol(pecas=pecas))

    assert campos_com_erro(erro.value) == [("pecas", 0, "y")]


def test_rejeita_cena_sem_lista_de_pecas():
    cena = cena_futebol()
    del cena["pecas"]

    with pytest.raises(ValidationError) as erro:
        Cena.model_validate(cena)

    assert campos_com_erro(erro.value) == [("pecas",)]
