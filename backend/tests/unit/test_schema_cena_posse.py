import pytest
from pydantic import ValidationError

from app.schemas.cena import Cena


def cena_basquete(bola: dict, jogador_a: dict | None = None) -> dict:
    """Cena com um jogador de cada time e a bola, sem ações."""
    return {
        "quadra": "basquete",
        "pecas": [
            jogador_a or {"id": "a1", "tipo": "jogador_time_a", "x": 300, "y": 250},
            {"id": "b1", "tipo": "jogador_time_b", "x": 500, "y": 250},
            bola,
        ],
    }


def test_aceita_bola_com_posse_de_jogador_do_time_a():
    cena = Cena.model_validate(cena_basquete({"id": "bola", "tipo": "bola", "x": 300, "y": 250, "posse": "a1"}))

    bola = next(peca for peca in cena.pecas if peca.tipo == "bola")
    assert bola.posse == "a1"


def test_aceita_bola_com_posse_de_jogador_do_time_b():
    cena = Cena.model_validate(cena_basquete({"id": "bola", "tipo": "bola", "x": 500, "y": 250, "posse": "b1"}))

    bola = next(peca for peca in cena.pecas if peca.tipo == "bola")
    assert bola.posse == "b1"


def test_bola_sem_posse_fica_solta():
    cena = Cena.model_validate(cena_basquete({"id": "bola", "tipo": "bola", "x": 400, "y": 100}))

    bola = next(peca for peca in cena.pecas if peca.tipo == "bola")
    assert bola.posse is None


def test_rejeita_posse_em_peca_que_nao_e_bola():
    jogador_com_posse = {"id": "a1", "tipo": "jogador_time_a", "x": 300, "y": 250, "posse": "b1"}

    with pytest.raises(ValidationError, match="só a bola pode ter posse"):
        Cena.model_validate(cena_basquete({"id": "bola", "tipo": "bola", "x": 400, "y": 100}, jogador_com_posse))


def test_rejeita_posse_de_jogador_inexistente():
    with pytest.raises(ValidationError, match="posse 'a9' não corresponde a nenhum jogador"):
        Cena.model_validate(cena_basquete({"id": "bola", "tipo": "bola", "x": 300, "y": 250, "posse": "a9"}))


def test_rejeita_bola_com_posse_dela_mesma():
    # "bola" é um id que existe na cena, mas não é de um jogador.
    with pytest.raises(ValidationError, match="posse 'bola' não corresponde a nenhum jogador"):
        Cena.model_validate(cena_basquete({"id": "bola", "tipo": "bola", "x": 300, "y": 250, "posse": "bola"}))
