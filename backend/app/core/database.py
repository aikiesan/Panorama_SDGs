from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from .config import settings

# Create database engine
connect_args = {}
engine_args = {}

if "sqlite" in settings.DATABASE_URL:
    connect_args = {"check_same_thread": False}
else:
    # QueuePool: reuse connections across requests instead of creating a new
    # TCP+TLS+auth handshake on every call (NullPool behaviour).
    # pool_size=3 is safe for Supabase Transaction Pooler (port 6543).
    engine_args.update({
        "pool_size": 3,
        "max_overflow": 5,
        "pool_timeout": 30,
        "pool_pre_ping": True,
    })

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    **engine_args
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()


def get_db():
    """Dependency for database sessions"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
