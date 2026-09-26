from typing import Literal

from pydantic import BaseModel, model_validator


class Peca(BaseModel):
    id: str
    tipo: Literal["jogador_time_a", "jogador_time_b", "bola"]
    x: float
    y: float


class Acao(BaseModel):
    id: str
    tipo: Literal["movimentacao", "passe"]
    origem: str
    destino: str
    ordem: int


class Cena(BaseModel):
    quadra: Literal["futebol", "basquete"]
    pecas: list[Peca]
    acoes: list[Acao] = []

    @model_validator(mode="after")
    def validar_acoes(self) -> "Cena":
        ordens = [acao.ordem for acao in self.acoes]
        if len(ordens) != len(set(ordens)):
            raise ValueError("acoes não podem ter ordens duplicadas")

        ids_pecas = {peca.id for peca in self.pecas}
        for acao in self.acoes:
            if acao.origem not in ids_pecas:
                raise ValueError(f"acao '{acao.id}': origem '{acao.origem}' não corresponde a nenhuma peca da cena")
            if acao.destino not in ids_pecas:
                raise ValueError(f"acao '{acao.id}': destino '{acao.destino}' não corresponde a nenhuma peca da cena")

        return self
