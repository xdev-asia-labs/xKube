"""xKube Backend - FastAPI Application."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.api import clusters, pods, deployments, logs, nodes, services, namespaces, auth
from app.routes import clusters as cluster_mgmt  # New cluster management routes
from app.routes import pods as pod_mgmt  # New pod management routes
from app.core.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    print("🚀 xKube API starting...")
    
    # Initialize database
    from app.database import init_db
    await init_db()
    print("✅ Database initialized")
    
    yield
    
    # Cleanup
    from app.database import close_db
    await close_db()
    print("👋 xKube API shutting down...")


app = FastAPI(
    title="xKube API",
    description="Kubernetes Management Platform API",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_url,
        "http://localhost:3000",
        "http://localhost:5173",  # Vite dev server
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(auth.router, prefix="/api", tags=["Authentication"])
app.include_router(cluster_mgmt.router)  # New cluster management (database-backed)
app.include_router(pod_mgmt.router)  # New pod management (database-backed)
app.include_router(clusters.router, prefix="/api/contexts", tags=["Contexts"])  # Old context-based
app.include_router(pods.router, prefix="/api/pods", tags=["Pods"])
app.include_router(deployments.router, prefix="/api/deployments", tags=["Deployments"])
app.include_router(logs.router, prefix="/api/logs", tags=["Logs"])
app.include_router(nodes.router, prefix="/api/nodes", tags=["Nodes"])
app.include_router(services.router, prefix="/api/services", tags=["Services"])
app.include_router(namespaces.router, prefix="/api/namespaces", tags=["Namespaces"])


@app.get("/")
async def root():
    """Health check."""
    return {"status": "ok", "service": "xKube API", "version": "1.0.0"}


@app.get("/api/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy"}
