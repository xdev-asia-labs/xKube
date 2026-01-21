"""
Database package
Simple JSON-based database for development
"""
from .database import Database

db = Database()

__all__ = ["db", "Database"]
