"""
Authentication API Routes
"""
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.models import (
    UserCreate,
    UserLogin, 
    UserResponse,
    TokenResponse,
    TokenRefreshRequest,
)
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer(auto_error=False)

# Import get_db for database sessions
from app.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession


# Helper to get current user from token
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
):
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = await auth_service.get_current_user(credentials.credentials, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


async def get_optional_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Optional auth - returns None if not authenticated"""
    if not credentials:
        return None
    return await auth_service.get_current_user(credentials.credentials)


# Routes
@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(data: UserCreate, db: AsyncSession = Depends(get_db)):
    """Register a new user with email and password"""
    
    # Check if registration is allowed
    if not settings.allow_registration:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Registration is disabled. Contact administrator for account creation.",
        )
    
    user, error = await auth_service.register_user(data, db)
    if error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error,
        )
    
    # Auto-login after registration
    tokens = await auth_service.create_tokens(user, db)
    return tokens


@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)):
    """Login with email and password"""
    user, error = await auth_service.authenticate_user(data.email, data.password, db)
    if error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=error,
        )
    
    tokens = await auth_service.create_tokens(user, db)
    return tokens


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(data: TokenRefreshRequest, db: AsyncSession = Depends(get_db)):
    """Refresh access token using refresh token"""
    tokens, error = await auth_service.refresh_access_token(data.refresh_token, db)
    if error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=error,
        )
    return tokens


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(data: TokenRefreshRequest, db: AsyncSession = Depends(get_db)):
    """Logout and revoke refresh token"""
    await auth_service.logout(data.refresh_token, db)
    return None


@router.get("/me", response_model=UserResponse)
async def get_me(user = Depends(get_current_user)):
    """Get current authenticated user"""
    return UserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        avatar_url=user.avatar_url,
        auth_provider=user.auth_provider,
        is_verified=user.is_verified,
        created_at=user.created_at,
    )


# ==================== OAuth Routes ====================
from fastapi.responses import RedirectResponse
from app.services import oauth_service
from app.core.config import settings


@router.get("/oauth/{provider}")
async def oauth_redirect(provider: str):
    """Redirect to OAuth provider for authentication"""
    if provider not in ["google", "github"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported OAuth provider: {provider}",
        )
    
    # Check if provider is configured
    if provider == "google" and not settings.google_client_id:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Google OAuth not configured",
        )
    if provider == "github" and not settings.github_client_id:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="GitHub OAuth not configured",
        )
    
    redirect_uri = f"{settings.backend_url}/api/auth/oauth/{provider}/callback"
    state = oauth_service.generate_state(provider, redirect_uri)
    
    provider_class = oauth_service.get_provider(provider)
    auth_url = provider_class.get_authorization_url(redirect_uri, state)
    
    return RedirectResponse(url=auth_url)


@router.get("/oauth/{provider}/callback")
async def oauth_callback(provider: str, code: str = None, state: str = None, error: str = None, db: AsyncSession = Depends(get_db)):
    """Handle OAuth callback from provider"""
    if error:
        # Redirect to frontend with error
        return RedirectResponse(
            url=f"{settings.frontend_url}/login?error={error}"
        )
    
    if not code:
        return RedirectResponse(
            url=f"{settings.frontend_url}/login?error=missing_code"
        )
    
    redirect_uri = f"{settings.backend_url}/api/auth/oauth/{provider}/callback"
    
    # Handle OAuth callback
    user, error_msg = await oauth_service.handle_callback(provider, code, redirect_uri)
    if error_msg:
        return RedirectResponse(
            url=f"{settings.frontend_url}/login?error={error_msg}"
        )
    
    # Create tokens
    tokens = await auth_service.create_tokens(user, db)
    
    # Redirect to frontend with tokens
    return RedirectResponse(
        url=f"{settings.frontend_url}/auth/callback?access_token={tokens.access_token}&refresh_token={tokens.refresh_token}"
    )

