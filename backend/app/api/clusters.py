"""Clusters API routes."""

from fastapi import APIRouter
from app.k8s import k8s_client, K8sClient

router = APIRouter()


@router.get("")
async def list_contexts():
    """List all available Kubernetes contexts."""
    return {
        "contexts": K8sClient.get_contexts(),
        "current": k8s_client.connected,
    }


@router.get("/info")
async def cluster_info():
    """Get current cluster information."""
    return k8s_client.get_cluster_info()


@router.post("/switch/{context_name}")
async def switch_context(context_name: str):
    """Switch to a different cluster context."""
    success = k8s_client.switch_context(context_name)
    return {
        "success": success,
        "context": context_name,
        "connected": k8s_client.connected,
        "error": k8s_client.error,
    }


@router.get("/namespaces")
async def list_namespaces():
    """List all namespaces."""
    return {"namespaces": k8s_client.list_namespaces()}
