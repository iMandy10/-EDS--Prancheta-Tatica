from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class TeamCreate(BaseModel):
    nome: str = Field(..., min_length=1)
    modalidade: Literal["futebol", "basquete"]


class TeamResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nome: str
    modalidade: str
    chave_treinador: str
    chave_atleta: str
    created_at: datetime
