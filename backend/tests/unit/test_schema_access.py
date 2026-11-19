from types import SimpleNamespace

import pytest
from pydantic import ValidationError

from app.schemas.access import TeamAccessResponse


def time_do_banco(**campos) -> SimpleNamespace:
    """Objeto com atributos, como o Team que a rota lê do banco (sem usar banco)."""
    padrao = {
        "id": 7,
        "nome": "Furacão FC",
        "modalidade": "basquete",
        "chave_treinador": "chave-secreta-do-treinador",
        "chave_atleta": "chave-do-atleta",
    }
    return SimpleNamespace(**(padrao | campos))


def test_le_id_nome_e_modalidade_de_um_objeto_com_atributos():
    resposta = TeamAccessResponse.model_validate(time_do_banco())

    assert (resposta.id, resposta.nome, resposta.modalidade) == (7, "Furacão FC", "basquete")


def test_nao_expoe_as_chaves_do_time():
    # O atleta recebe esta resposta: com a chave do treinador ele poderia editar as jogadas.
    dados = TeamAccessResponse.model_validate(time_do_banco()).model_dump()

    assert set(dados) == {"id", "nome", "modalidade"}
    assert "chave-secreta-do-treinador" not in str(dados)


def test_rejeita_objeto_sem_nome():
    time_sem_nome = time_do_banco()
    del time_sem_nome.nome

    with pytest.raises(ValidationError, match="nome"):
        TeamAccessResponse.model_validate(time_sem_nome)
