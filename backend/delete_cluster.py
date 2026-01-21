#!/usr/bin/env python3
"""
Delete a cluster by name or ID
"""
import asyncio
import sys
from pathlib import Path
from uuid import UUID

sys.path.insert(0, str(Path(__file__).parent))

from app.database import AsyncSessionLocal
from app.models import Cluster
from sqlalchemy import select


async def delete_cluster(identifier: str):
    """Delete a cluster by name or ID"""
    async with AsyncSessionLocal() as db:
        # Try as UUID first
        try:
            cluster_id = UUID(identifier)
            result = await db.execute(
                select(Cluster).where(Cluster.id == cluster_id)
            )
        except ValueError:
            # Not a UUID, search by name
            result = await db.execute(
                select(Cluster).where(Cluster.name == identifier)
            )
        
        cluster = result.scalar_one_or_none()
        
        if not cluster:
            print(f"❌ Cluster not found: {identifier}")
            return False
        
        print(f"🗑️  Deleting cluster:")
        print(f"   ID: {cluster.id}")
        print(f"   Name: {cluster.name}")
        print(f"   Description: {cluster.description}")
        
        await db.delete(cluster)
        await db.commit()
        
        print(f"\n✅ Cluster deleted successfully!")
        return True


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python delete_cluster.py <cluster_name_or_id>")
        print("\nExample:")
        print("  python delete_cluster.py microk8s")
        print("  python delete_cluster.py 9d5cc9ad-8420-4603-8f13-5877b157f19c")
        sys.exit(1)
    
    identifier = sys.argv[1]
    asyncio.run(delete_cluster(identifier))
