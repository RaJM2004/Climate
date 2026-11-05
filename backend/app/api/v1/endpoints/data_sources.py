from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import DataSource
from app.schemas.schemas import DataSourceOut

router = APIRouter()

@router.get("", response_model=List[DataSourceOut])
def get_data_sources(db: Session = Depends(get_db)):
    """Retrieves all connected data providers with operational and licensing status."""
    return db.query(DataSource).all()
