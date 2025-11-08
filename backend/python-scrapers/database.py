"""
Database connection and operations
"""
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool
from contextlib import contextmanager
from typing import Generator
from loguru import logger

from config import settings


class Database:
    """Database connection manager"""

    def __init__(self):
        self.engine = None
        self.SessionLocal = None

    def connect(self):
        """Initialize database connection"""
        try:
            self.engine = create_engine(
                settings.database_url,
                poolclass=QueuePool,
                pool_size=5,
                max_overflow=10,
                pool_pre_ping=True,
                echo=False,
            )

            self.SessionLocal = sessionmaker(
                autocommit=False, autoflush=False, bind=self.engine
            )

            # Test connection
            with self.engine.connect() as conn:
                conn.execute(text("SELECT 1"))

            logger.info(f"Connected to database: {settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_DATABASE}")

        except Exception as e:
            logger.error(f"Failed to connect to database: {e}")
            raise

    def disconnect(self):
        """Close database connection"""
        if self.engine:
            self.engine.dispose()
            logger.info("Database connection closed")

    @contextmanager
    def get_session(self) -> Generator[Session, None, None]:
        """
        Get database session context manager

        Usage:
            with db.get_session() as session:
                session.execute(...)
        """
        session = self.SessionLocal()
        try:
            yield session
            session.commit()
        except Exception as e:
            session.rollback()
            logger.error(f"Database session error: {e}")
            raise
        finally:
            session.close()

    def execute_query(self, query: str, params: dict = None) -> list:
        """Execute a raw SQL query and return results"""
        with self.get_session() as session:
            result = session.execute(text(query), params or {})
            return result.fetchall()

    def execute_update(self, query: str, params: dict = None) -> int:
        """Execute an UPDATE/INSERT/DELETE query"""
        with self.get_session() as session:
            result = session.execute(text(query), params or {})
            return result.rowcount


# Global database instance
db = Database()
