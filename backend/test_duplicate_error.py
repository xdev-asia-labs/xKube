#!/usr/bin/env python3
"""
Test cluster creation with duplicate name to verify error handling
"""
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from app.database import AsyncSessionLocal
from app.services.cluster_service import ClusterService
from app.schemas import ClusterCreate
from app.models import User
from sqlalchemy import select


async def test_duplicate_cluster():
    """Test creating a duplicate cluster"""
    
    async with AsyncSessionLocal() as db:
        # Get first user
        result = await db.execute(select(User).limit(1))
        user = result.scalar_one_or_none()
        
        if not user:
            print("❌ No users found. Run create_admin.py first!")
            return
        
        print(f"✅ Using user: {user.email}\n")
        
        # Create first cluster
        print("📝 Creating first cluster 'test-duplicate'...")
        cluster_data = ClusterCreate(
            name="test-duplicate",
            description="Testing duplicate error handling",
            tags=["test"],
            context_name="microk8s"
        )
        
        try:
            cluster1 = await ClusterService.create_cluster(db, cluster_data, user.id)
            print(f"✅ First cluster created successfully!")
            print(f"   ID: {cluster1.id}")
            print(f"   Name: {cluster1.name}\n")
        except ValueError as e:
            print(f"⚠️  Cluster already exists (this is expected if running multiple times)")
            print(f"   Error: {str(e)}\n")
            
            # Try to continue with existing cluster
            result = await db.execute(
                select(User).where(User.email == user.email)
            )
            user = result.scalar_one()
        
        # Try to create duplicate cluster
        print("📝 Attempting to create duplicate cluster 'test-duplicate'...")
        cluster_data2 = ClusterCreate(
            name="test-duplicate",  # Same name - should fail
            description="This should fail",
            tags=["test"],
            context_name="microk8s"
        )
        
        try:
            cluster2 = await ClusterService.create_cluster(db, cluster_data2, user.id)
            print(f"❌ ERROR: Duplicate cluster was created! This should not happen!")
            print(f"   ID: {cluster2.id}")
        except ValueError as e:
            print(f"✅ Duplicate cluster properly rejected!")
            print(f"   Error message: {str(e)}")
            print(f"\n🎉 Error handling is working correctly!")
            print(f"   The API will return: HTTP 400 Bad Request")
            print(f"   With message: {str(e)}")


if __name__ == "__main__":
    asyncio.run(test_duplicate_cluster())
