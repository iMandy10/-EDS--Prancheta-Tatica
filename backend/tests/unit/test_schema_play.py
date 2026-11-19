from datetime import datetime
from types import SimpleNamespace

import pytest
from pydantic import ValidationError

from app.schemas.play import PlayCreate, PlayResponse, PlaySummary, PlayUpdate

# Unidade: os schemas de jogada chamados direto, sem HTTP nem banco.

CENA = {"quadra": "futebol", "pecas": [{"id": "A1", "tipo": "jogador_time_a", "x": 100, "y": 200}]}


def campos_com_erro(erro: ValidationError) -> list[tuple]:
    return [e["loc"] for e in erro.errors()]


def test_jogada_nova_comeca_como_rascunho_e_sem_descricao():
    jogada = PlayCreate.model_validate({"titulo": "Saída de bola", "cena": CENA})

    assert jogada.status == "rascunho"
    assert jogada.descricao is None
    assert jogada.cena.pecas[0].id == "A1"


def test_aceita_jogada_ja_publicada_com_descricao():
    jogada = PlayCreate.model_validate(
        {"titulo": "Escanteio", "descricao": "Fechado", "status": "publicada", "cena": CENA}
    )

    assert (jogada.status, jogada.descricao) == ("publicada", "Fechado")


@pytest.mark.parametrize("dados, campo", [
    ({"titulo": "", "cena": CENA}, ("titulo",)),
    ({"cena": CENA}, ("titulo",)),
    ({"titulo": "X", "status": "arquivada", "cena": CENA}, ("status",)),
    ({"titulo": "X"}, ("cena",)),
])
def test_rejeita_jogada_sem_titulo_com_status_inexistente_ou_sem_cena(dados, campo):
    with pytest.raises(ValidationError) as erro:
        PlayCreate.model_validate(dados)

    assert campos_com_erro(erro.value) == [campo]


def test_a_cena_da_jogada_tambem_e_validada():
    cena_invalida = {**CENA, "acoes": [{"id": "x", "tipo": "passe", "origem": "A9", "destino": "A1", "ordem": 1}]}

    with pytest.raises(ValidationError, match="origem 'A9'"):
        PlayCreate.model_validate({"titulo": "X", "cena": cena_invalida})


def test_edicao_guarda_so_os_campos_enviados():
    edicao = PlayUpdate.model_validate({"status": "publicada"})

    assert edicao.model_dump(exclude_unset=True) == {"status": "publicada"}


def test_edicao_pode_apagar_a_descricao():
    edicao = PlayUpdate.model_validate({"descricao": None})

    assert edicao.model_dump(exclude_unset=True) == {"descricao": None}


@pytest.mark.parametrize("dados, campo", [
    ({"titulo": ""}, ("titulo",)),
    ({"status": "arquivada"}, ("status",)),
])
def test_edicao_rejeita_titulo_vazio_e_status_inexistente(dados, campo):
    with pytest.raises(ValidationError) as erro:
        PlayUpdate.model_validate(dados)

    assert campos_com_erro(erro.value) == [campo]


def test_monta_resposta_e_resumo_a_partir_da_jogada_do_banco():
    agora = datetime(2026, 11, 19, 10, 0)
    jogada = SimpleNamespace(id=3, team_id=7, titulo="Saída", descricao=None, cena_json=CENA,
                             status="rascunho", created_at=agora, updated_at=agora)

    resposta = PlayResponse.model_validate(jogada)
    resumo = PlaySummary.model_validate(jogada)

    assert resposta.cena_json == CENA
    assert resumo.model_dump() == {"id": 3, "team_id": 7, "titulo": "Saída", "descricao": None,
                                   "status": "rascunho", "created_at": agora, "updated_at": agora}
