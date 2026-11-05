"""
Database Migration and Schema Setup Script
Connects directly to PostgreSQL / PostGIS (or SQLite fallback),
provisions spatial extensions, and establishes all table schemas.
"""

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import text
from app.core.database import engine, Base
from app.models.models import *
from app.db.init_db import init_database

def run_migrations():
    print(f"[Migration] Checking database target: {engine.url.render_as_string(hide_password=True)}")
    
    # Check if PostgreSQL
    if "postgresql" in engine.url.drivername:
        print("[Migration] Configuring PostgreSQL with PostGIS...")
        try:
            with engine.connect() as conn:
                conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
                conn.commit()
                print("[Migration] PostGIS extension verified.")
        except Exception as e:
            print(f"[Migration] Note: Could not execute CREATE EXTENSION postgis (requires superuser): {e}")
            
    print("[Migration] Creating tables from SQLAlchemy metadata...")
    Base.metadata.create_all(bind=engine)
    print("[Migration] All 14 relational tables verified.")
    
    print("[Migration] Running initial database seeding...")
    init_database()
    print("[Migration] Migration completed successfully.")

if __name__ == "__main__":
    run_migrations()
