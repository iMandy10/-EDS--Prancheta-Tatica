from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.team import Team
from app.schemas.access import TeamAccessResponse

router = APIRouter(tags=["access"])


@router.get("/teams/access/{chave_atleta}", response_model=TeamAccessResponse)
def get_team_by_chave_atleta(chave_atleta: str, db: Session = Depends(get_db)) -> Team:
    team = db.query(Team).filter(Team.chave_atleta == chave_atleta).first()
    if team is None:
        raise HTTPException(status_code=404, detail="Chave de atleta inválida")
    return team
