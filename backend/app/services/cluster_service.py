"""
Cluster service - business logic for cluster management
"""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
from uuid import UUID
from pathlib import Path
import yaml
from kubernetes import client, config
from kubernetes.config import ConfigException
import tempfile
import os

from app.models import Cluster
from app.schemas import ClusterCreate, ClusterUpdate, ClusterConnectionTest
from app.services.encryption import encrypt_kubeconfig, decrypt_kubeconfig


class ClusterService:
    """Service for managing Kubernetes clusters"""
    
    @staticmethod
    async def create_cluster(
        db: AsyncSession,
        cluster_data: ClusterCreate,
        owner_id: UUID
    ) -> Cluster:
        """Create a new cluster"""
        kubeconfig_content = cluster_data.kubeconfig
        context = cluster_data.context
        
        # If context_name is provided, import from ~/.kube/config
        if cluster_data.context_name:
            kubeconfig_path = Path.home() / ".kube" / "config"
            if not kubeconfig_path.exists():
                raise ValueError("No local kubeconfig found at ~/.kube/config")
            
            with open(kubeconfig_path, 'r') as f:
                local_config = yaml.safe_load(f)
            
            # Extract the specific context
            context_name = cluster_data.context_name
            context = context_name
            
            # Find context definition
            ctx_def = next((c for c in local_config.get('contexts', []) if c['name'] == context_name), None)
            if not ctx_def:
                raise ValueError(f"Context '{context_name}' not found in kubeconfig")
            
            ctx_info = ctx_def['context']
            cluster_name = ctx_info['cluster']
            user_name = ctx_info['user']
            
            # Find cluster and user definitions
            cluster_def = next((c for c in local_config.get('clusters', []) if c['name'] == cluster_name), None)
            user_def = next((u for u in local_config.get('users', []) if u['name'] == user_name), None)
            
            if not cluster_def or not user_def:
                raise ValueError(f"Cluster or user definition not found for context '{context_name}'")
            
            # Build minimal kubeconfig with only this context
            minimal_config = {
                'apiVersion': 'v1',
                'kind': 'Config',
                'current-context': context_name,
                'contexts': [ctx_def],
                'clusters': [cluster_def],
                'users': [user_def]
            }
            
            kubeconfig_content = yaml.dump(minimal_config)
        
        if not kubeconfig_content:
            raise ValueError("Either kubeconfig or context_name must be provided")
        
        # Encrypt kubeconfig
        encrypted_kubeconfig = encrypt_kubeconfig(kubeconfig_content)
        
        # Create cluster object
        cluster = Cluster(
            name=cluster_data.name,
            description=cluster_data.description,
            kubeconfig_encrypted=encrypted_kubeconfig,
            context=context,
            tags=cluster_data.tags or [],
            owner_id=owner_id,
            is_active=False,
            is_connected=False
        )
        
        db.add(cluster)
        
        try:
            await db.commit()
            await db.refresh(cluster)
        except IntegrityError as e:
            await db.rollback()
            # Check if it's a unique constraint violation on name
            if 'ix_clusters_name' in str(e) or 'duplicate key' in str(e).lower():
                raise ValueError(f"A cluster with the name '{cluster_data.name}' already exists")
            # Re-raise other integrity errors
            raise
        
        return cluster
    
    @staticmethod
    async def get_cluster(db: AsyncSession, cluster_id: UUID) -> Optional[Cluster]:
        """Get cluster by ID"""
        result = await db.execute(
            select(Cluster).where(Cluster.id == cluster_id)
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_clusters(
        db: AsyncSession,
        owner_id: Optional[UUID] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Cluster]:
        """Get list of clusters"""
        query = select(Cluster)
        
        if owner_id:
            query = query.where(Cluster.owner_id == owner_id)
        
        query = query.offset(skip).limit(limit)
        
        result = await db.execute(query)
        return list(result.scalars().all())
    
    @staticmethod
    async def update_cluster(
        db: AsyncSession,
        cluster_id: UUID,
        cluster_update: ClusterUpdate
    ) -> Optional[Cluster]:
        """Update cluster"""
        cluster = await ClusterService.get_cluster(db, cluster_id)
        if not cluster:
            return None
        
        # Update fields
        update_data = cluster_update.model_dump(exclude_unset=True)
        
        # Handle kubeconfig encryption if provided
        if "kubeconfig" in update_data:
            update_data["kubeconfig_encrypted"] = encrypt_kubeconfig(update_data.pop("kubeconfig"))
        
        for field, value in update_data.items():
            setattr(cluster, field, value)
        
        await db.commit()
        await db.refresh(cluster)
        
        return cluster
    
    @staticmethod
    async def delete_cluster(db: AsyncSession, cluster_id: UUID) -> bool:
        """Delete cluster"""
        cluster = await ClusterService.get_cluster(db, cluster_id)
        if not cluster:
            return False
        
        await db.delete(cluster)
        await db.commit()
        
        return True
    
    @staticmethod
    async def test_connection(cluster: Cluster) -> ClusterConnectionTest:
        """Test cluster connection"""
        try:
            # Decrypt kubeconfig
            kubeconfig_content = decrypt_kubeconfig(cluster.kubeconfig_encrypted)
            
            # Write to temp file
            with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.yaml') as f:
                f.write(kubeconfig_content)
                temp_kubeconfig = f.name
            
            try:
                # Load kubeconfig
                config.load_kube_config(config_file=temp_kubeconfig, context=cluster.context)
                
                # Test connection
                v1 = client.VersionApi()
                version_info = v1.get_code()
                
                return ClusterConnectionTest(
                    connected=True,
                    version=version_info.git_version
                )
            
            except ConfigException as e:
                return ClusterConnectionTest(
                    connected=False,
                    error=f"Kubeconfig error: {str(e)}"
                )
            except Exception as e:
                return ClusterConnectionTest(
                    connected=False,
                    error=f"Connection failed: {str(e)}"
                )
            finally:
                # Clean up temp file
                if os.path.exists(temp_kubeconfig):
                    os.unlink(temp_kubeconfig)
        
        except Exception as e:
            return ClusterConnectionTest(
                connected=False,
                error=f"Failed to decrypt kubeconfig: {str(e)}"
            )
    
    @staticmethod
    async def activate_cluster(db: AsyncSession, cluster_id: UUID) -> Optional[Cluster]:
        """Set cluster as active (deactivate others)"""
        cluster = await ClusterService.get_cluster(db, cluster_id)
        if not cluster:
            return None
        
        # Deactivate all clusters for this owner
        await db.execute(
            Cluster.__table__.update()
            .where(Cluster.owner_id == cluster.owner_id)
            .values(is_active=False)
        )
        
        # Activate this cluster
        cluster.is_active = True
        
        await db.commit()
        await db.refresh(cluster)
        
        return cluster
