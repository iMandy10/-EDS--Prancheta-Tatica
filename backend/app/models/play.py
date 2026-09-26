from datetime import datetime

from sqlalchemy import JSON, Column, DateTime, Enum, ForeignKey, Integer, String

from app.database import Base


class Play(Base):
    __tablename__ = "plays"

    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=False, index=True)
    titulo = Column(String, nullable=False)
    descricao = Column(String, nullable=True)
    cena_json = Column(JSON, nullable=False)
    status = Column(Enum("rascunho", "publicada", name="play_status_enum"), nullable=False, default="rascunho")
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
