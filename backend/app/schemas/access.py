from pydantic import BaseModel, ConfigDict


class TeamAccessResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nome: str
    modalidade: str
