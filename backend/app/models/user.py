"""
User and Authentication Models
"""
from datetime import datetime
from typing import Optional
from uuid import uuid4
from pydantic import BaseModel, EmailStr, Field
from enum import Enum


class AuthProvider(str, Enum):
    LOCAL = "local"
    GOOGLE = "google"
    GITHUB = "github"
    KEYCLOAK = "keycloak"
    AUTH0 = "auth0"
    OIDC = "oidc"


# Database models (simplified for SQLite)
class UserDB(BaseModel):
    """User stored in database"""
    id: str = Field(default_factory=lambda: str(uuid4()))
    email: str
    password_hash: Optional[str] = None  # null for OAuth users
    name: str
    avatar_url: Optional[str] = None
    is_active: bool = True
    is_verified: bool = False
    auth_provider: AuthProvider = AuthProvider.LOCAL
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        from_attributes = True


class RefreshTokenDB(BaseModel):
    """Refresh token stored in database"""
    id: str = Field(default_factory=lambda: str(uuid4()))
    user_id: str
    token_hash: str
    expires_at: datetime
    revoked: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)


# API Request/Response models
class UserCreate(BaseModel):
    """Request model for user registration"""
    email: EmailStr
    password: str = Field(min_length=8)
    name: str = Field(min_length=2)


class UserLogin(BaseModel):
    """Request model for login"""
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """Public user response"""
    id: str
    email: str
    name: str
    avatar_url: Optional[str] = None
    auth_provider: AuthProvider
    is_verified: bool
    created_at: datetime


class TokenResponse(BaseModel):
    """Token response after login"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds


class TokenRefreshRequest(BaseModel):
    """Request to refresh access token"""
    refresh_token: str


class OAuthState(BaseModel):
    """OAuth state for CSRF protection"""
    provider: str
    redirect_uri: str
    nonce: str
