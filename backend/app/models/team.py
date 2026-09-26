import secrets
from datetime import datetime

from sqlalchemy import Column, DateTime, Enum, Integer, String

from app.database import Base


def generate_key() -> str:
    return secrets.token_urlsafe(9)


class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    modalidade = Column(Enum("futebol", "basquete", name="modalidade_enum"), nullable=False)
    chave_treinador = Column(String, unique=True, index=True, nullable=False, default=generate_key)
    chave_atleta = Column(String, unique=True, index=True, nullable=False, default=generate_key)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
