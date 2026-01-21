"""
API routes for pod management
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.database import Cluster
from app.services.k8s_client import k8s_client_service
from app.api.auth import get_current_user

router = APIRouter()


async def get_active_cluster(
    db: AsyncSession = Depends(get_db),
    user = Depends(get_current_user)
) -> Cluster:
    """Get the active cluster for the current user"""
    from sqlalchemy import select
    
    result = await db.execute(
        select(Cluster).where(
            Cluster.user_id == user.id,
            Cluster.is_active == True
        )
    )
    cluster = result.scalar_one_or_none()
    
    if not cluster:
        raise HTTPException(
            status_code=404,
            detail="No active cluster found. Please activate a cluster first."
        )
    
    return cluster


@router.get("/pods")
async def list_pods(
    namespace: str = Query(default="", description="Namespace to filter pods (empty = all namespaces)"),
    label_selector: Optional[str] = Query(default=None, description="Label selector to filter pods"),
    cluster: Cluster = Depends(get_active_cluster)
):
    """
    List all pods in the active cluster
    
    - **namespace**: Namespace to filter (empty string for all namespaces)
    - **label_selector**: Optional label selector (e.g., "app=nginx")
    """
    try:
        pods = await k8s_client_service.list_pods(
            kubeconfig=cluster.kubeconfig,
            context=cluster.context,
            namespace=namespace or "",
            label_selector=label_selector
        )
        return {
            "cluster_id": cluster.id,
            "cluster_name": cluster.name,
            "namespace": namespace or "all",
            "pods": pods,
            "total_count": len(pods)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/pods/{namespace}/{name}")
async def get_pod(
    namespace: str,
    name: str,
    cluster: Cluster = Depends(get_active_cluster)
):
    """Get detailed information about a specific pod"""
    try:
        pod = await k8s_client_service.get_pod(
            kubeconfig=cluster.kubeconfig,
            context=cluster.context,
            namespace=namespace,
            name=name
        )
        return pod
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/pods/{namespace}/{name}")
async def delete_pod(
    namespace: str,
    name: str,
    cluster: Cluster = Depends(get_active_cluster)
):
    """Delete a pod"""
    try:
        result = await k8s_client_service.delete_pod(
            kubeconfig=cluster.kubeconfig,
            context=cluster.context,
            namespace=namespace,
            name=name
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/pods/{namespace}/{name}/logs")
async def get_pod_logs(
    namespace: str,
    name: str,
    container: Optional[str] = Query(default=None, description="Container name (for multi-container pods)"),
    tail_lines: Optional[int] = Query(default=100, description="Number of lines to tail"),
    cluster: Cluster = Depends(get_active_cluster)
):
    """Get logs from a pod"""
    try:
        logs = await k8s_client_service.get_pod_logs(
            kubeconfig=cluster.kubeconfig,
            context=cluster.context,
            namespace=namespace,
            name=name,
            container=container,
            tail_lines=tail_lines
        )
        return {
            "namespace": namespace,
            "pod": name,
            "container": container,
            "tail_lines": tail_lines,
            "logs": logs
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
