import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app


@pytest.fixture
def client():
    """Cliente HTTP da API ligado a um banco SQLite em memória, novo a cada teste."""
    # StaticPool faz todas as sessões usarem a mesma conexão: sem isso, cada
    # conexão nova abriria um banco em memória vazio.
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


@pytest.fixture
def time(client):
    """Time de futebol criado pela API, com as duas chaves (treinador e atleta)."""
    resposta = client.post("/teams", json={"nome": "Time de Teste", "modalidade": "futebol"})
    assert resposta.status_code == 201
    return resposta.json()


@pytest.fixture
def cena_valida():
    """Cena de futebol válida: dois jogadores, a bola e uma movimentação."""
    return {
        "quadra": "futebol",
        "pecas": [
            {"id": "A1", "tipo": "jogador_time_a", "x": 100, "y": 200},
            {"id": "B1", "tipo": "jogador_time_b", "x": 300, "y": 200},
            {"id": "bola", "tipo": "bola", "x": 120, "y": 200},
        ],
        "acoes": [
            {"id": "a1", "tipo": "movimentacao", "origem": "A1", "destino": {"x": 150, "y": 250}, "ordem": 1},
        ],
    }
