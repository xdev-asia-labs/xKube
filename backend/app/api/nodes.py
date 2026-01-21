"""Nodes API routes."""

from fastapi import APIRouter
from app.k8s import k8s_client

router = APIRouter()


@router.get("")
async def list_nodes():
    """List all cluster nodes."""
    return {"nodes": k8s_client.list_nodes()}
