from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.cena import Cena


class PlayCreate(BaseModel):
    titulo: str = Field(..., min_length=1)
    descricao: str | None = None
    status: Literal["rascunho", "publicada"] = "rascunho"
    cena: Cena


class PlayUpdate(BaseModel):
    titulo: str | None = Field(default=None, min_length=1)
    descricao: str | None = None
    status: Literal["rascunho", "publicada"] | None = None


class PlayResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    team_id: int
    titulo: str
    descricao: str | None
    cena_json: dict
    status: str
    created_at: datetime
    updated_at: datetime
