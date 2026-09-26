from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.play import Play
from app.models.team import Team
from app.schemas.access import TeamAccessResponse
from app.schemas.play import PlayResponse, PlaySummary

router = APIRouter(tags=["access"])


@router.get("/teams/access/{chave_atleta}", response_model=TeamAccessResponse)
def get_team_by_chave_atleta(chave_atleta: str, db: Session = Depends(get_db)) -> Team:
    team = db.query(Team).filter(Team.chave_atleta == chave_atleta).first()
    if team is None:
        raise HTTPException(status_code=404, detail="Chave de atleta inválida")
    return team


@router.get("/teams/{team_id}/plays/published", response_model=list[PlaySummary])
def list_published_plays(
    team_id: int,
    x_chave_atleta: str = Header(..., alias="X-Chave-Atleta"),
    db: Session = Depends(get_db),
) -> list[Play]:
    team = db.query(Team).filter(Team.id == team_id).first()
    if team is None or team.chave_atleta != x_chave_atleta:
        raise HTTPException(status_code=404, detail="Time não encontrado")

    return (
        db.query(Play)
        .filter(Play.team_id == team.id, Play.status == "publicada")
        .order_by(Play.updated_at.desc())
        .all()
    )


@router.get("/teams/{team_id}/plays/published/{play_id}", response_model=PlayResponse)
def get_published_play(
    team_id: int,
    play_id: int,
    x_chave_atleta: str = Header(..., alias="X-Chave-Atleta"),
    db: Session = Depends(get_db),
) -> Play:
    play = (
        db.query(Play)
        .join(Team, Team.id == Play.team_id)
        .filter(
            Play.id == play_id,
            Play.team_id == team_id,
            Play.status == "publicada",
            Team.chave_atleta == x_chave_atleta,
        )
        .first()
    )
    if play is None:
        raise HTTPException(status_code=404, detail="Jogada não encontrada")

    return play
