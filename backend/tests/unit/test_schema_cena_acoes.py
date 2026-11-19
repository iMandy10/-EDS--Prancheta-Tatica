import pytest
from pydantic import ValidationError

from app.schemas.cena import Cena, PontoDestino

# Unidade: o schema Cena chamado direto, sem HTTP nem banco. Aqui, só as regras das ações (setas).

PECAS = [
    {"id": "A1", "tipo": "jogador_time_a", "x": 100, "y": 200},
    {"id": "A2", "tipo": "jogador_time_a", "x": 200, "y": 100},
    {"id": "B1", "tipo": "jogador_time_b", "x": 300, "y": 200},
    {"id": "bola", "tipo": "bola", "x": 113, "y": 213, "posse": "A1"},
]


def acao(id: str, tipo: str, origem: str, destino, ordem: int) -> dict:
    return {"id": id, "tipo": tipo, "origem": origem, "destino": destino, "ordem": ordem}


def cena_com(*acoes: dict) -> dict:
    return {"quadra": "basquete", "pecas": PECAS, "acoes": list(acoes)}


def test_cena_sem_acoes_tem_lista_de_acoes_vazia():
    cena = Cena.model_validate({"quadra": "basquete", "pecas": PECAS})

    assert cena.acoes == []


def test_destino_pode_ser_uma_peca_ou_um_ponto_da_quadra():
    # Peças diferentes agindo no mesmo instante (ordem 1) também é permitido.
    cena = Cena.model_validate(cena_com(
        acao("p", "passe", "A1", "A2", 1),
        acao("m", "movimentacao", "B1", {"x": 400, "y": 250}, 1),
    ))

    assert cena.acoes[0].destino == "A2"
    assert cena.acoes[1].destino == PontoDestino(x=400, y=250)


@pytest.mark.parametrize("tipo", ["movimentacao", "passe", "bloqueio", "drible"])
def test_aceita_os_quatro_tipos_de_acao(tipo):
    cena = Cena.model_validate(cena_com(acao("x", tipo, "A1", {"x": 10, "y": 10}, 1)))

    assert cena.acoes[0].tipo == tipo


def test_rejeita_tipo_de_acao_inexistente():
    with pytest.raises(ValidationError):
        Cena.model_validate(cena_com(acao("x", "chute", "A1", {"x": 10, "y": 10}, 1)))


def test_rejeita_acao_que_sai_de_peca_que_nao_esta_na_cena():
    with pytest.raises(ValidationError, match="origem 'A9' não corresponde a nenhuma peca"):
        Cena.model_validate(cena_com(acao("x", "movimentacao", "A9", {"x": 10, "y": 10}, 1)))


def test_rejeita_acao_que_vai_para_peca_que_nao_esta_na_cena():
    with pytest.raises(ValidationError, match="destino 'A9' não corresponde a nenhuma peca"):
        Cena.model_validate(cena_com(acao("x", "passe", "A1", "A9", 1)))


def test_rejeita_ponto_de_destino_sem_coordenada():
    with pytest.raises(ValidationError):
        Cena.model_validate(cena_com(acao("x", "movimentacao", "A1", {"x": 10}, 1)))


def test_rejeita_duas_acoes_da_mesma_peca_no_mesmo_instante():
    with pytest.raises(ValidationError, match="peca 'A2' tem mais de uma acao na ordem 1"):
        Cena.model_validate(cena_com(
            acao("m1", "movimentacao", "A2", {"x": 10, "y": 10}, 1),
            acao("m2", "bloqueio", "A2", "B1", 1),
        ))


def test_aceita_duas_acoes_da_mesma_peca_em_instantes_diferentes():
    cena = Cena.model_validate(cena_com(
        acao("m1", "movimentacao", "A2", {"x": 10, "y": 10}, 1),
        acao("m2", "bloqueio", "A2", "B1", 2),
    ))

    assert [a.ordem for a in cena.acoes] == [1, 2]


@pytest.mark.parametrize("segunda", [
    acao("d", "drible", "A2", {"x": 10, "y": 10}, 1),
    acao("mb", "movimentacao", "bola", {"x": 10, "y": 10}, 1),
])
def test_rejeita_duas_acoes_com_a_bola_no_mesmo_instante(segunda):
    with pytest.raises(ValidationError, match="a bola tem mais de uma acao na ordem 1"):
        Cena.model_validate(cena_com(acao("p", "passe", "A1", "A2", 1), segunda))


def test_aceita_acoes_com_a_bola_em_instantes_diferentes():
    cena = Cena.model_validate(cena_com(
        acao("p", "passe", "A1", "A2", 1),
        acao("d", "drible", "A2", {"x": 10, "y": 10}, 2),
    ))

    assert [a.tipo for a in cena.acoes] == ["passe", "drible"]
