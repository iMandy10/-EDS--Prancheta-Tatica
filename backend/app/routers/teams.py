from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.team import Team
from app.schemas.team import TeamCreate, TeamResponse

router = APIRouter(prefix="/teams", tags=["teams"])


@router.post("", response_model=TeamResponse, status_code=201)
def create_team(payload: TeamCreate, db: Session = Depends(get_db)) -> Team:
    team = Team(nome=payload.nome, modalidade=payload.modalidade)
    db.add(team)
    db.commit()
    db.refresh(team)
    return team


@router.get("/{chave_treinador}", response_model=TeamResponse)
def get_team_by_chave_treinador(chave_treinador: str, db: Session = Depends(get_db)) -> Team:
    team = db.query(Team).filter(Team.chave_treinador == chave_treinador).first()
    if team is None:
        raise HTTPException(status_code=404, detail="Time não encontrado")
    return team
