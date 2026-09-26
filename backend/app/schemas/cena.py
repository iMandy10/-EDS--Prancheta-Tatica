from typing import Literal

from pydantic import BaseModel


class Peca(BaseModel):
    id: str
    tipo: Literal["jogador_time_a", "jogador_time_b", "bola"]
    x: float
    y: float


class Cena(BaseModel):
    quadra: Literal["futebol", "basquete"]
    pecas: list[Peca]
