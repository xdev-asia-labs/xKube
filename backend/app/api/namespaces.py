"""Namespaces API routes."""

from fastapi import APIRouter
from app.k8s import k8s_client

router = APIRouter()


@router.get("")
async def list_namespaces():
    """List all namespaces."""
    namespaces_data = k8s_client.list_namespaces()
    return {"namespaces": [ns["name"] for ns in namespaces_data]}
