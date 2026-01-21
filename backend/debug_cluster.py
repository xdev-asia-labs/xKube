#!/usr/bin/env python3
"""
Debug cluster creation issues
"""
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from app.database import AsyncSessionLocal
from app.services.cluster_service import ClusterService
from app.schemas import ClusterCreate
import yaml
import traceback


async def debug_cluster_creation():
    """Test cluster creation"""
    
    # Check if kubeconfig exists
    kubeconfig_path = Path.home() / ".kube" / "config"
    print(f"Checking kubeconfig at: {kubeconfig_path}")
    
    if not kubeconfig_path.exists():
        print("❌ No kubeconfig file found!")
        return
    
    print("✅ Kubeconfig file exists")
    
    # Load and parse kubeconfig
    try:
        with open(kubeconfig_path, 'r') as f:
            config = yaml.safe_load(f)
        
        print(f"\n📋 Available contexts:")
        for ctx in config.get('contexts', []):
            print(f"   - {ctx['name']}")
        
        # Check if microk8s exists
        microk8s_ctx = next((c for c in config.get('contexts', []) if c['name'] ==  'microk8s'), None)
        if not microk8s_ctx:
            print("\n❌ 'microk8s' context not found in kubeconfig")
            return
        
        print("\n✅ 'microk8s' context found")
        print(f"   Context info: {microk8s_ctx}")
        
        # Try to create cluster
        cluster_data = ClusterCreate(
            name="microk8s",
            description="Imported from microk8s",
            tags=[],
            context_name="microk8s"
        )
        
        print("\n🔧 Testing cluster creation...")
        
        async with AsyncSessionLocal() as db:
            # We need a user_id - let's try to get first user
            from app.models import User
            from sqlalchemy import select
            
            result = await db.execute(select(User).limit(1))
            user = result.scalar_one_or_none()
            
            if not user:
                print("❌ No users found in database. Run create_admin.py first!")
                return
            
            print(f"✅ Using user: {user.email} (ID: {user.id})")
            
            try:
                cluster = await ClusterService.create_cluster(db, cluster_data, user.id)
                print(f"\n✅ Cluster created successfully!")
                print(f"   Name: {cluster.name}")
                print(f"   Context: {cluster.context}")
                print(f"   ID: {cluster.id}")
            except Exception as e:
                print(f"\n❌ Failed to create cluster:")
                print(f"   Error: {str(e)}")
                print(f"\n   Full traceback:")
                traceback.print_exc()
    
    except Exception as e:
        print(f"❌ Error reading kubeconfig: {str(e)}")
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(debug_cluster_creation())
