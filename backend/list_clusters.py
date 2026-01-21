#!/usr/bin/env python3
"""
List all clusters in the database
"""
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from app.database import AsyncSessionLocal
from app.models import Cluster
from sqlalchemy import select


async def list_clusters():
    """List all clusters"""
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Cluster))
        clusters = result.scalars().all()
        
        if not clusters:
            print("No clusters found in database")
            return
        
        print(f"\n📋 Found {len(clusters)} cluster(s):\n")
        for cluster in clusters:
            print(f"  ID: {cluster.id}")
            print(f"  Name: {cluster.name}")
            print(f"  Description: {cluster.description}")
            print(f"  Context: {cluster.context}")
            print(f"  Owner ID: {cluster.owner_id}")
            print(f"  Active: {cluster.is_active}")
            print(f"  Connected: {cluster.is_connected}")
            print(f"  Created: {cluster.created_at}")
            print("  " + "="*50)


if __name__ == "__main__":
    asyncio.run(list_clusters())
