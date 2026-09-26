from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.play import Play
from app.models.team import Team
from app.schemas.play import PlayCreate, PlayResponse, PlayUpdate

router = APIRouter(tags=["plays"])


@router.post("/teams/{team_id}/plays", response_model=PlayResponse, status_code=201)
def create_play(
    team_id: int,
    payload: PlayCreate,
    x_chave_treinador: str = Header(..., alias="X-Chave-Treinador"),
    db: Session = Depends(get_db),
) -> Play:
    team = db.query(Team).filter(Team.id == team_id).first()
    if team is None or team.chave_treinador != x_chave_treinador:
        raise HTTPException(status_code=404, detail="Time não encontrado")

    play = Play(
        team_id=team.id,
        titulo=payload.titulo,
        descricao=payload.descricao,
        status=payload.status,
        cena_json=payload.cena.model_dump(),
    )
    db.add(play)
    db.commit()
    db.refresh(play)
    return play


@router.patch("/plays/{play_id}", response_model=PlayResponse)
def update_play(
    play_id: int,
    payload: PlayUpdate,
    x_chave_treinador: str = Header(..., alias="X-Chave-Treinador"),
    db: Session = Depends(get_db),
) -> Play:
    play = (
        db.query(Play)
        .join(Team, Team.id == Play.team_id)
        .filter(Play.id == play_id, Team.chave_treinador == x_chave_treinador)
        .first()
    )
    if play is None:
        raise HTTPException(status_code=404, detail="Jogada não encontrada")

    for campo, valor in payload.model_dump(exclude_unset=True).items():
        setattr(play, campo, valor)

    db.commit()
    db.refresh(play)
    return play
