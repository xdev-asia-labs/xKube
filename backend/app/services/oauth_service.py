"""
OAuth Service for Google and GitHub authentication
"""
import secrets
import httpx
from typing import Optional, Tuple
from urllib.parse import urlencode

from app.models.user import UserDB, AuthProvider, OAuthState
from app.db import db
from app.core.config import settings
from app.services.auth_service import auth_service


class OAuthUserInfo:
    """Normalized user info from OAuth provider"""
    def __init__(self, email: str, name: str, avatar_url: Optional[str], provider_id: str):
        self.email = email
        self.name = name
        self.avatar_url = avatar_url
        self.provider_id = provider_id


class GoogleOAuth:
    """Google OAuth2 provider"""
    AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
    TOKEN_URL = "https://oauth2.googleapis.com/token"
    USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"
    
    @classmethod
    def get_authorization_url(cls, redirect_uri: str, state: str) -> str:
        params = {
            "client_id": settings.google_client_id,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": "openid email profile",
            "state": state,
            "access_type": "offline",
        }
        return f"{cls.AUTH_URL}?{urlencode(params)}"
    
    @classmethod
    async def exchange_code(cls, code: str, redirect_uri: str) -> Tuple[OAuthUserInfo, str]:
        """Exchange auth code for tokens and user info. Returns (user_info, error)"""
        async with httpx.AsyncClient() as client:
            # Exchange code for tokens
            token_response = await client.post(cls.TOKEN_URL, data={
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": redirect_uri,
            })
            
            if token_response.status_code != 200:
                return None, f"Failed to exchange code: {token_response.text}"
            
            tokens = token_response.json()
            access_token = tokens.get("access_token")
            
            # Get user info
            userinfo_response = await client.get(
                cls.USERINFO_URL,
                headers={"Authorization": f"Bearer {access_token}"}
            )
            
            if userinfo_response.status_code != 200:
                return None, "Failed to get user info"
            
            data = userinfo_response.json()
            user_info = OAuthUserInfo(
                email=data["email"],
                name=data.get("name", data["email"].split("@")[0]),
                avatar_url=data.get("picture"),
                provider_id=data["id"],
            )
            return user_info, None


class GitHubOAuth:
    """GitHub OAuth2 provider"""
    AUTH_URL = "https://github.com/login/oauth/authorize"
    TOKEN_URL = "https://github.com/login/oauth/access_token"
    USERINFO_URL = "https://api.github.com/user"
    EMAILS_URL = "https://api.github.com/user/emails"
    
    @classmethod
    def get_authorization_url(cls, redirect_uri: str, state: str) -> str:
        params = {
            "client_id": settings.github_client_id,
            "redirect_uri": redirect_uri,
            "scope": "user:email read:user",
            "state": state,
        }
        return f"{cls.AUTH_URL}?{urlencode(params)}"
    
    @classmethod
    async def exchange_code(cls, code: str, redirect_uri: str) -> Tuple[OAuthUserInfo, str]:
        """Exchange auth code for tokens and user info. Returns (user_info, error)"""
        async with httpx.AsyncClient() as client:
            # Exchange code for tokens
            token_response = await client.post(
                cls.TOKEN_URL,
                data={
                    "client_id": settings.github_client_id,
                    "client_secret": settings.github_client_secret,
                    "code": code,
                    "redirect_uri": redirect_uri,
                },
                headers={"Accept": "application/json"}
            )
            
            if token_response.status_code != 200:
                return None, f"Failed to exchange code: {token_response.text}"
            
            tokens = token_response.json()
            if "error" in tokens:
                return None, tokens.get("error_description", tokens["error"])
                
            access_token = tokens.get("access_token")
            
            # Get user info
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Accept": "application/json",
            }
            
            userinfo_response = await client.get(cls.USERINFO_URL, headers=headers)
            if userinfo_response.status_code != 200:
                return None, "Failed to get user info"
            
            data = userinfo_response.json()
            
            # Get primary email if not in profile
            email = data.get("email")
            if not email:
                emails_response = await client.get(cls.EMAILS_URL, headers=headers)
                if emails_response.status_code == 200:
                    emails = emails_response.json()
                    primary = next((e for e in emails if e.get("primary")), emails[0] if emails else None)
                    email = primary["email"] if primary else None
            
            if not email:
                return None, "Could not get email from GitHub"
            
            user_info = OAuthUserInfo(
                email=email,
                name=data.get("name") or data.get("login", email.split("@")[0]),
                avatar_url=data.get("avatar_url"),
                provider_id=str(data["id"]),
            )
            return user_info, None


class OAuthService:
    """OAuth service coordinating all providers"""
    
    PROVIDERS = {
        "google": GoogleOAuth,
        "github": GitHubOAuth,
    }
    
    @classmethod
    def get_provider(cls, name: str):
        return cls.PROVIDERS.get(name)
    
    @classmethod
    def generate_state(cls, provider: str, redirect_uri: str) -> str:
        """Generate state token for CSRF protection"""
        nonce = secrets.token_urlsafe(16)
        # In production, store state in Redis/DB with expiry
        return f"{provider}:{nonce}"
    
    @classmethod
    def parse_state(cls, state: str) -> Tuple[str, str]:
        """Parse state token. Returns (provider, nonce)"""
        parts = state.split(":", 1)
        return parts[0], parts[1] if len(parts) > 1 else ""
    
    @classmethod
    async def handle_callback(
        cls, provider_name: str, code: str, redirect_uri: str
    ) -> Tuple[UserDB, str]:
        """Handle OAuth callback. Returns (user, error)"""
        provider = cls.get_provider(provider_name)
        if not provider:
            return None, f"Unknown provider: {provider_name}"
        
        # Exchange code for user info
        user_info, error = await provider.exchange_code(code, redirect_uri)
        if error:
            return None, error
        
        # Find or create user
        existing_user = await db.get_user_by_email(user_info.email)
        
        if existing_user:
            # Update avatar if needed
            if user_info.avatar_url and not existing_user.avatar_url:
                existing_user.avatar_url = user_info.avatar_url
                await db.update_user(existing_user)
            return existing_user, None
        
        # Create new user
        auth_provider = AuthProvider(provider_name)
        new_user = UserDB(
            email=user_info.email.lower(),
            name=user_info.name,
            avatar_url=user_info.avatar_url,
            auth_provider=auth_provider,
            is_verified=True,  # OAuth emails are verified
        )
        await db.create_user(new_user)
        return new_user, None


oauth_service = OAuthService()
