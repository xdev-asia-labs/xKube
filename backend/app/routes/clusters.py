"""
Cluster management API routes
"""
from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from pathlib import Path
import yaml # Assuming yamlerService is meant to be yaml

from app.database import get_db
from app.schemas import ClusterCreate, ClusterUpdate, ClusterResponse, ClusterConnectionTest
from app.services.cluster_service import ClusterService
from app.models import Cluster
from app.api.auth import get_current_user

router = APIRouter(prefix="/api/clusters", tags=["clusters"])



@router.post("/", response_model=ClusterResponse)
async def create_cluster(
    cluster_data: ClusterCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Create a new Kubernetes cluster configuration
    
    If a cluster with the same name already exists for this user, returns the existing cluster.
    This allows seamless re-import of clusters without errors.
    
    - **name**: Unique cluster name
    - **kubeconfig**: Base64-encoded kubeconfig content
    - **context**: Kubernetes context name
    - **description**: Optional description
    - **tags**: Optional tags for organization
    """
    try:
        # Check if cluster already exists for this user
        existing_clusters = await ClusterService.get_clusters(db, owner_id=current_user.id)
        existing = next((c for c in existing_clusters if c.name == cluster_data.name), None)
        
        if existing:
            # Cluster already exists - return it instead of creating a duplicate
            # The frontend can navigate to this cluster's details page
            print(f"INFO: Cluster '{cluster_data.name}' already exists, returning existing cluster")
            return existing
        
        # Create new cluster
        cluster = await ClusterService.create_cluster(db, cluster_data, current_user.id)
        return cluster
    except ValueError as e:
        # Handle validation errors (missing configs, invalid kubeconfig, etc.)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Log the full error for debugging
        import traceback
        print(f"ERROR creating cluster: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        print(f"Cluster data: {cluster_data.model_dump()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create cluster: {str(e)}"
        )


@router.get("/", response_model=List[ClusterResponse])
async def list_clusters(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """List all clusters for the current user"""
    clusters = await ClusterService.get_clusters(db, owner_id=current_user.id, skip=skip, limit=limit)
    return clusters


@router.get("/auto-detect")
async def auto_detect_clusters(
    current_user = Depends(get_current_user)
):
    """
    Auto-detect Kubernetes clusters from local kubeconfig file (~/.kube/config)
    Returns list of available contexts for user to import
    """
    try:
        # Read kubeconfig from user's home directory
        kubeconfig_path = Path.home() / ".kube" / "config"
        
        if not kubeconfig_path.exists():
            return {
                "success": False,
                "message": "No kubeconfig file found at ~/.kube/config",
                "contexts": [],
                "kubeconfig_path": str(kubeconfig_path)
            }
        
        # Parse kubeconfig YAML
        with open(kubeconfig_path, 'r') as f:
            kubeconfig_content = f.read()
            config_data = yaml.safe_load(kubeconfig_content)
        
        # Extract contexts
        contexts_list = []
        current_context = config_data.get('current-context', '')
        
        for ctx in config_data.get('contexts', []):
            context_name = ctx.get('name', '')
            context_info = ctx.get('context', {})
            cluster_name = context_info.get('cluster', '')
            user_name = context_info.get('user', '')
            namespace = context_info.get('namespace', 'default')
            
            # Get cluster server URL if available
            cluster_server = ''
            for cluster in config_data.get('clusters', []):
                if cluster.get('name') == cluster_name:
                    cluster_server = cluster.get('cluster', {}).get('server', '')
                    break
            
            contexts_list.append({
                'name': context_name,
                'cluster': cluster_name,
                'user': user_name,
                'namespace': namespace,
                'server': cluster_server,
                'is_current': context_name == current_context
            })
        
        return {
            "success": True,
            "message": f"Found {len(contexts_list)} context(s)",
            "contexts": contexts_list,
            "current_context": current_context,
            "kubeconfig_path": str(kubeconfig_path)
        }
        
    except yaml.YAMLError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to parse kubeconfig: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to auto-detect clusters: {str(e)}"
        )


@router.get("/{cluster_id}", response_model=ClusterResponse)
async def get_cluster(
    cluster_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get cluster details by ID"""
    cluster = await ClusterService.get_cluster(db, cluster_id)
    
    if not cluster:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cluster not found"
        )
    
    # Check ownership
    if cluster.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this cluster"
        )
    
    return cluster


@router.put("/{cluster_id}", response_model=ClusterResponse)
async def update_cluster(
    cluster_id: UUID,
    cluster_update: ClusterUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update cluster configuration"""
    cluster = await ClusterService.get_cluster(db, cluster_id)
    
    if not cluster:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cluster not found"
        )
    
    # Check ownership
    if cluster.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to modify this cluster"
        )
    
    updated_cluster = await ClusterService.update_cluster(db, cluster_id, cluster_update)
    return updated_cluster


@router.delete("/{cluster_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_cluster(
    cluster_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Delete a cluster"""
    cluster = await ClusterService.get_cluster(db, cluster_id)
    
    if not cluster:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cluster not found"
        )
    
    # Check ownership
    if cluster.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this cluster"
        )
    
    await ClusterService.delete_cluster(db, cluster_id)
    return None


@router.post("/{cluster_id}/connect", response_model=ClusterConnectionTest)
async def test_cluster_connection(
    cluster_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Test connection to Kubernetes cluster"""
    cluster = await ClusterService.get_cluster(db, cluster_id)
    
    if not cluster:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cluster not found"
        )
    
    # Check ownership
    if cluster.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to test this cluster"
        )
    
    # Test connection
    result = await ClusterService.test_connection(cluster)
    
    # Update cluster status
    cluster.is_connected = result.connected
    if result.version:
        cluster.version = result.version
    
    if result.connected:
        from datetime import datetime
        cluster.last_connected_at = datetime.utcnow()
    
    await db.commit()
    
    return result


@router.put("/{cluster_id}/activate", response_model=ClusterResponse)
async def activate_cluster(
    cluster_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Set cluster as active (deactivate others)"""
    cluster = await ClusterService.get_cluster(db, cluster_id)
    
    if not cluster:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cluster not found"
        )
    
    # Check ownership
    if cluster.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to activate this cluster"
        )
    
    activated_cluster = await ClusterService.activate_cluster(db, cluster_id)
    return activated_cluster
