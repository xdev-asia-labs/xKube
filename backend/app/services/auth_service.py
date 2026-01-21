"""
Authentication Service
Handles JWT tokens, password hashing, and token validation
"""
import hashlib
import secrets
import bcrypt
from datetime import datetime, timedelta
from typing import Optional, Tuple
from jose import jwt, JWTError

from app.models.user import UserDB, RefreshTokenDB, UserCreate, TokenResponse, AuthProvider
from app.core.config import settings
from app.services.user_repository import UserRepository
from app.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession


class AuthService:
    """Authentication service for JWT and password operations"""
    
    # JWT Settings
    SECRET_KEY = settings.jwt_secret_key
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = 15
    REFRESH_TOKEN_EXPIRE_DAYS = 7
    
    # Password methods
    @staticmethod
    def hash_password(password: str) -> str:
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    
    # Token methods
    @classmethod
    def create_access_token(cls, user_id: str, extra_data: dict = None) -> str:
        expire = datetime.utcnow() + timedelta(minutes=cls.ACCESS_TOKEN_EXPIRE_MINUTES)
        payload = {
            "sub": user_id,
            "exp": expire,
            "type": "access",
            **(extra_data or {})
        }
        return jwt.encode(payload, cls.SECRET_KEY, algorithm=cls.ALGORITHM)
    
    @classmethod
    def create_refresh_token(cls) -> Tuple[str, str, datetime]:
        """Returns (raw_token, token_hash, expires_at)"""
        raw_token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
        expires_at = datetime.utcnow() + timedelta(days=cls.REFRESH_TOKEN_EXPIRE_DAYS)
        return raw_token, token_hash, expires_at
    
    @classmethod
    def decode_access_token(cls, token: str) -> Optional[dict]:
        try:
            payload = jwt.decode(token, cls.SECRET_KEY, algorithms=[cls.ALGORITHM])
            if payload.get("type") != "access":
                return None
            return payload
        except JWTError:
            return None
    
    # User authentication
    @classmethod
    async def register_user(cls, data: UserCreate, db: AsyncSession) -> Tuple[UserDB, str]:
        """Register a new user. Returns (user, error_message)"""
        # Check if email exists
        existing = await UserRepository.get_user_by_email(db, data.email)
        if existing:
            return None, "Email already registered"
        
        # Create user
        user = UserDB(
            email=data.email.lower(),
            password_hash=cls.hash_password(data.password),
            name=data.name,
            auth_provider=AuthProvider.LOCAL,
        )
        await UserRepository.create_user(db, user)
        return user, None
    
    @classmethod
    async def authenticate_user(cls, email: str, password: str, db: AsyncSession) -> Tuple[UserDB, str]:
        """Authenticate user with email/password. Returns (user, error_message)"""
        user = await UserRepository.get_user_by_email(db, email)
        if not user:
            return None, "Invalid email or password"
        
        if not user.password_hash:
            return None, f"Please login with {user.auth_provider.value}"
        
        if not cls.verify_password(password, user.password_hash):
            return None, "Invalid email or password"
        
        if not user.is_active:
            return None, "Account is disabled"
        
        return user, None
    
    @classmethod
    async def create_tokens(cls, user: UserDB, db: AsyncSession) -> TokenResponse:
        """Create access and refresh tokens for user"""
        # Access token
        access_token = cls.create_access_token(user.id, {"email": user.email})
        
        # Refresh token
        raw_refresh, token_hash, expires_at = cls.create_refresh_token()
        
        # Store refresh token
        refresh_token_db = RefreshTokenDB(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=expires_at,
        )
        await UserRepository.create_refresh_token(db, refresh_token_db)
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=raw_refresh,
            expires_in=cls.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )
    
    @classmethod
    async def refresh_access_token(cls, refresh_token: str, db: AsyncSession) -> Tuple[TokenResponse, str]:
        """Refresh access token. Returns (tokens, error_message)"""
        token_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
        
        # Find token
        token_db = await UserRepository.get_refresh_token_by_hash(db, token_hash)
        if not token_db:
            return None, "Invalid refresh token"
        
        # Check expiry
        if token_db.expires_at < datetime.utcnow():
            await UserRepository.revoke_refresh_token(db, token_db.id)
            return None, "Refresh token expired"
        
        # Get user
        user = await UserRepository.get_user_by_id(db, token_db.user_id)
        if not user or not user.is_active:
            return None, "User not found or inactive"
        
        # Revoke old token (rotation)
        await UserRepository.revoke_refresh_token(db, token_db.id)
        
        # Create new tokens
        tokens = await cls.create_tokens(user, db)
        return tokens, None
    
    @classmethod
    async def logout(cls, refresh_token: str, db: AsyncSession) -> bool:
        """Revoke refresh token"""
        token_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
        token_db = await UserRepository.get_refresh_token_by_hash(db, token_hash)
        if token_db:
            await UserRepository.revoke_refresh_token(db, token_db.id)
            return True
        return False
    
    @classmethod
    async def get_current_user(cls, token: str, db: AsyncSession) -> Optional[UserDB]:
        """Get user from access token"""
        payload = cls.decode_access_token(token)
        if not payload:
            return None
        
        user_id = payload.get("sub")
        if not user_id:
            return None
        
        return await UserRepository.get_user_by_id(db, user_id)


# Global service instance
auth_service = AuthService()
