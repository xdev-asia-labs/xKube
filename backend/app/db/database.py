"""
Simple JSON-based database for development
For production, replace with PostgreSQL/SQLAlchemy
"""
import json
import os
from pathlib import Path
from typing import Optional, List
from datetime import datetime
import asyncio

from app.models.user import UserDB, RefreshTokenDB


class Database:
    """Simple file-based JSON database"""
    
    def __init__(self, db_path: str = "data/db.json"):
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._lock = asyncio.Lock()
        self._data = self._load()
    
    def _load(self) -> dict:
        if self.db_path.exists():
            with open(self.db_path, 'r') as f:
                return json.load(f)
        return {"users": {}, "refresh_tokens": {}}
    
    async def _save(self):
        async with self._lock:
            with open(self.db_path, 'w') as f:
                json.dump(self._data, f, indent=2, default=str)
    
    # User operations
    async def create_user(self, user: UserDB) -> UserDB:
        self._data["users"][user.id] = user.model_dump()
        await self._save()
        return user
    
    async def get_user_by_id(self, user_id: str) -> Optional[UserDB]:
        data = self._data["users"].get(user_id)
        return UserDB(**data) if data else None
    
    async def get_user_by_email(self, email: str) -> Optional[UserDB]:
        """Get user by email"""
        for user_data in self._data["users"].values():
            if user_data["email"].lower() == email.lower():
                return UserDB(**user_data)
        return None
    
    async def list_users(self) -> list[UserDB]:
        """List all users"""
        return [UserDB(**user_data) for user_data in self._data["users"].values()]
    
    async def update_user(self, user: UserDB) -> UserDB:
        user.updated_at = datetime.utcnow()
        self._data["users"][user.id] = user.model_dump()
        await self._save()
        return user
    
    async def delete_user(self, user_id: str) -> bool:
        if user_id in self._data["users"]:
            del self._data["users"][user_id]
            await self._save()
            return True
        return False
    
    # Refresh token operations
    async def create_refresh_token(self, token: RefreshTokenDB) -> RefreshTokenDB:
        self._data["refresh_tokens"][token.id] = token.model_dump()
        await self._save()
        return token
    
    async def get_refresh_token_by_hash(self, token_hash: str) -> Optional[RefreshTokenDB]:
        for token_data in self._data["refresh_tokens"].values():
            if token_data["token_hash"] == token_hash and not token_data["revoked"]:
                return RefreshTokenDB(**token_data)
        return None
    
    async def revoke_refresh_token(self, token_id: str) -> bool:
        if token_id in self._data["refresh_tokens"]:
            self._data["refresh_tokens"][token_id]["revoked"] = True
            await self._save()
            return True
        return False
    
    async def revoke_all_user_tokens(self, user_id: str) -> int:
        count = 0
        for token_data in self._data["refresh_tokens"].values():
            if token_data["user_id"] == user_id and not token_data["revoked"]:
                token_data["revoked"] = True
                count += 1
        if count > 0:
            await self._save()
        return count


# Global database instance
db = Database()
