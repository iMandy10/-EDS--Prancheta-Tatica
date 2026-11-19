from datetime import datetime

import pytest
from pydantic import ValidationError

from app.models.team import Team
from app.schemas.team import TeamCreate, TeamResponse


def campos_com_erro(erro: ValidationError) -> list[tuple]:
    """Campos apontados pelo Pydantic como inválidos (garante que o erro é no campo certo)."""
    return [e["loc"] for e in erro.errors()]


# TeamCreate


@pytest.mark.parametrize("modalidade", ["futebol", "basquete"])
def test_aceita_time_das_duas_modalidades(modalidade):
    time = TeamCreate.model_validate({"nome": "Furacão", "modalidade": modalidade})

    assert time.nome == "Furacão"
    assert time.modalidade == modalidade


def test_rejeita_nome_vazio():
    with pytest.raises(ValidationError) as erro:
        TeamCreate.model_validate({"nome": "", "modalidade": "futebol"})

    assert campos_com_erro(erro.value) == [("nome",)]


def test_rejeita_time_sem_nome():
    with pytest.raises(ValidationError) as erro:
        TeamCreate.model_validate({"modalidade": "futebol"})

    assert campos_com_erro(erro.value) == [("nome",)]


def test_rejeita_modalidade_inexistente():
    with pytest.raises(ValidationError) as erro:
        TeamCreate.model_validate({"nome": "Furacão", "modalidade": "volei"})

    assert campos_com_erro(erro.value) == [("modalidade",)]


# TeamResponse


def test_monta_resposta_a_partir_do_time_do_banco():
    criado_em = datetime(2026, 11, 18, 10, 30)
    time = Team(
        id=7,
        nome="Furacão",
        modalidade="basquete",
        chave_treinador="chave-do-treinador",
        chave_atleta="chave-do-atleta",
        created_at=criado_em,
    )

    resposta = TeamResponse.model_validate(time)

    assert resposta.model_dump() == {
        "id": 7,
        "nome": "Furacão",
        "modalidade": "basquete",
        "chave_treinador": "chave-do-treinador",
        "chave_atleta": "chave-do-atleta",
        "created_at": criado_em,
    }
