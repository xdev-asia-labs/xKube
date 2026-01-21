"""
User repository for database operations
Replaces the JSON-based database with PostgreSQL
"""
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.sql import func
from datetime import datetime
import uuid

from app.models.database import User, RefreshToken
from app.models.user import UserDB, RefreshTokenDB, AuthProvider


class UserRepository:
    """Repository for User operations"""
    
    @staticmethod
    async def create_user(db: AsyncSession, user: UserDB) -> User:
        """Create a new user in PostgreSQL"""
        db_user = User(
            id=uuid.UUID(user.id) if isinstance(user.id, str) else user.id,
            email=user.email,
            name=user.name,
            hashed_password=user.password_hash,
            avatar_url=user.avatar_url,
            is_active=user.is_active,
            is_superuser=False,
        )
        db.add(db_user)
        await db.commit()
        await db.refresh(db_user)
        return db_user
    
    @staticmethod
    async def get_user_by_id(db: AsyncSession, user_id: str) -> Optional[UserDB]:
        """Get user by ID"""
        result = await db.execute(
            select(User).where(User.id == uuid.UUID(user_id))
        )
        user = result.scalar_one_or_none()
        
        if not user:
            return None
        
        return UserDB(
            id=str(user.id),
            email=user.email,
            name=user.name,
            password_hash=user.hashed_password,
            avatar_url=user.avatar_url,
            is_active=user.is_active,
            is_verified=True,  # All local users are verified
            auth_provider=AuthProvider.LOCAL,
            created_at=user.created_at,
            updated_at=user.updated_at,
        )
    
    @staticmethod
    async def get_user_by_email(db: AsyncSession, email: str) -> Optional[UserDB]:
        """Get user by email"""
        result = await db.execute(
            select(User).where(func.lower(User.email) == email.lower())
        )
        user = result.scalar_one_or_none()
        
        if not user:
            return None
        
        return UserDB(
            id=str(user.id),
            email=user.email,
            name=user.name,
            password_hash=user.hashed_password,
            avatar_url=user.avatar_url,
            is_active=user.is_active,
            is_verified=True,
            auth_provider=AuthProvider.LOCAL,
            created_at=user.created_at,
            updated_at=user.updated_at,
        )
    
    @staticmethod
    async def list_users(db: AsyncSession) -> List[UserDB]:
        """List all users"""
        result = await db.execute(select(User))
        users = result.scalars().all()
        
        return [
            UserDB(
                id=str(user.id),
                email=user.email,
                name=user.name,
                password_hash=user.hashed_password,
                avatar_url=user.avatar_url,
                is_active=user.is_active,
                is_verified=True,
                auth_provider=AuthProvider.LOCAL,
                created_at=user.created_at,
                updated_at=user.updated_at,
            )
            for user in users
        ]
    
    @staticmethod
    async def create_refresh_token(db: AsyncSession, token: RefreshTokenDB) -> RefreshToken:
        """Create refresh token"""
        db_token = RefreshToken(
            id=uuid.UUID(token.id) if isinstance(token.id, str) else token.id,
            user_id=uuid.UUID(token.user_id) if isinstance(token.user_id, str) else token.user_id,
            token_hash=token.token_hash,
            revoked=token.revoked,
            expires_at=token.expires_at,
        )
        db.add(db_token)
        await db.commit()
        await db.refresh(db_token)
        return db_token
    
    @staticmethod
    async def get_refresh_token_by_hash(db: AsyncSession, token_hash: str) -> Optional[RefreshTokenDB]:
        """Get refresh token by hash"""
        result = await db.execute(
            select(RefreshToken).where(
                RefreshToken.token_hash == token_hash,
                RefreshToken.revoked == False
            )
        )
        token = result.scalar_one_or_none()
        
        if not token:
            return None
        
        return RefreshTokenDB(
            id=str(token.id),
            user_id=str(token.user_id),
            token_hash=token.token_hash,
            revoked=token.revoked,
            expires_at=token.expires_at,
            created_at=token.created_at,
        )
    
    @staticmethod
    async def revoke_refresh_token(db: AsyncSession, token_id: str) -> bool:
        """Revoke refresh token"""
        result = await db.execute(
            select(RefreshToken).where(RefreshToken.id == uuid.UUID(token_id))
        )
        token = result.scalar_one_or_none()
        
        if not token:
            return False
        
        token.revoked = True
        await db.commit()
        return True
    
    @staticmethod
    async def revoke_all_user_tokens(db: AsyncSession, user_id: str) -> int:
        """Revoke all refresh tokens for a user"""
        result = await db.execute(
            select(RefreshToken).where(
                RefreshToken.user_id == uuid.UUID(user_id),
                RefreshToken.revoked == False
            )
        )
        tokens = result.scalars().all()
        
        count = 0
        for token in tokens:
            token.revoked = True
            count += 1
        
        if count > 0:
            await db.commit()
        
        return count
