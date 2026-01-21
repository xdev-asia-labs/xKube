"""Logs API routes."""

from fastapi import APIRouter
from app.k8s import k8s_client

router = APIRouter()


@router.get("/pod/{namespace}/{name}")
async def get_pod_logs(namespace: str, name: str, tail: int = 100):
    """Get logs for a specific pod."""
    logs = k8s_client.get_pod_logs(name, namespace, tail_lines=tail)
    return {"logs": logs, "pod": name, "namespace": namespace}
