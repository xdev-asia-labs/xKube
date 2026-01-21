"""Deployments API routes."""

from fastapi import APIRouter
from app.k8s import k8s_client

router = APIRouter()


@router.get("")
async def list_deployments(namespace: str = "default"):
    """List deployments in a namespace."""
    return {"deployments": k8s_client.list_deployments(namespace)}


@router.get("/all")
async def list_all_deployments():
    """List deployments in all namespaces."""
    return {"deployments": k8s_client.list_deployments("all")}
