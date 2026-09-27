from typing import Literal

from pydantic import BaseModel, model_validator


class Peca(BaseModel):
    id: str
    tipo: Literal["jogador_time_a", "jogador_time_b", "bola"]
    x: float
    y: float
    # Só na bola: id do jogador que está com ela (None = bola solta em x, y).
    posse: str | None = None


class PontoDestino(BaseModel):
    x: float
    y: float


class Acao(BaseModel):
    id: str
    tipo: Literal["movimentacao", "passe", "bloqueio", "drible"]
    origem: str
    destino: str | PontoDestino
    ordem: int


class Cena(BaseModel):
    quadra: Literal["futebol", "basquete"]
    # Ausente em jogadas salvas antes desta funcionalidade = "completa".
    visualizacao: Literal["completa", "meia_quadra"] = "completa"
    pecas: list[Peca]
    acoes: list[Acao] = []

    @model_validator(mode="after")
    def validar_acoes(self) -> "Cena":
        ids_pecas = {peca.id for peca in self.pecas}
        ids_bola = {peca.id for peca in self.pecas if peca.tipo == "bola"}
        for peca in self.pecas:
            if peca.posse is None:
                continue
            if peca.tipo != "bola":
                raise ValueError(f"peca '{peca.id}': só a bola pode ter posse")
            if peca.posse not in ids_pecas - ids_bola:
                raise ValueError(f"bola: posse '{peca.posse}' não corresponde a nenhum jogador da cena")

        for acao in self.acoes:
            if acao.origem not in ids_pecas:
                raise ValueError(f"acao '{acao.id}': origem '{acao.origem}' não corresponde a nenhuma peca da cena")
            if isinstance(acao.destino, str) and acao.destino not in ids_pecas:
                raise ValueError(f"acao '{acao.id}': destino '{acao.destino}' não corresponde a nenhuma peca da cena")

        # Ações com a mesma ordem acontecem no mesmo instante: cada peça faz no
        # máximo uma ação por instante, e só uma ação por instante move a bola
        # (passe, drible ou movimentação da própria bola).
        origens_por_ordem: dict[int, set[str]] = {}
        ordens_com_bola: set[int] = set()
        for acao in self.acoes:
            origens = origens_por_ordem.setdefault(acao.ordem, set())
            if acao.origem in origens:
                raise ValueError(f"peca '{acao.origem}' tem mais de uma acao na ordem {acao.ordem}")
            origens.add(acao.origem)

            if acao.tipo in ("passe", "drible") or acao.origem in ids_bola:
                if acao.ordem in ordens_com_bola:
                    raise ValueError(f"a bola tem mais de uma acao na ordem {acao.ordem}")
                ordens_com_bola.add(acao.ordem)

        return self
