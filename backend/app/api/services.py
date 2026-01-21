"""Services API routes."""

from fastapi import APIRouter
from app.k8s import k8s_client

router = APIRouter()


@router.get("")
async def list_services(namespace: str = "default"):
    """List services in a namespace."""
    return {"services": k8s_client.list_services(namespace)}


@router.get("/all")
async def list_all_services():
    """List services in all namespaces."""
    return {"services": k8s_client.list_services("all")}
