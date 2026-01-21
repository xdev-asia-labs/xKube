"""Application configuration."""

from pydantic_settings import BaseSettings
import secrets


class Settings(BaseSettings):
    """Application settings."""
    
    app_name: str = "xKube"
    debug: bool = True
    
    # K8s
    kubeconfig_path: str | None = None
    k8s_insecure: bool = True
    
    # JWT Auth
    jwt_secret_key: str = secrets.token_urlsafe(32)
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7
    
    # Registration
    allow_registration: bool = False  # Set to False to disable public registration
    
    # OAuth - Google
    google_client_id: str | None = None
    google_client_secret: str | None = None
    
    # OAuth - GitHub
    github_client_id: str | None = None
    github_client_secret: str | None = None
    
    # External Auth
    external_auth_provider: str | None = None  # keycloak, auth0, oidc
    keycloak_url: str | None = None
    keycloak_realm: str | None = None
    keycloak_client_id: str | None = None
    auth0_domain: str | None = None
    auth0_client_id: str | None = None
    
    # App URLs
    frontend_url: str = "http://localhost:5173"
    backend_url: str = "http://localhost:8888"
    
    class Config:
        env_prefix = "XKUBE_"


settings = Settings()

