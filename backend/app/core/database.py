import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
database_url = settings.DATABASE_URL

if database_url.startswith("sqlite:///."):
    # Resolve relative SQLite path to backend directory consistently
    rel_path = database_url.replace("sqlite:///.", "").lstrip("/")
    abs_db_path = os.path.join(BACKEND_DIR, rel_path).replace("\\", "/")
    database_url = f"sqlite:///{abs_db_path}"

if database_url.startswith("sqlite"):
    engine = create_engine(
        database_url,
        connect_args={"check_same_thread": False}
    )
else:
    # PostgreSQL / PostGIS
    engine = create_engine(
        database_url,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
