"""Pods API routes."""

from fastapi import APIRouter
from app.k8s import k8s_client

router = APIRouter()


@router.get("")
async def list_pods(namespace: str = "default"):
    """List pods in a namespace."""
    return {"pods": k8s_client.list_pods(namespace)}


@router.get("/all")
async def list_all_pods():
    """List pods in all namespaces."""
    return {"pods": k8s_client.list_pods("all")}
