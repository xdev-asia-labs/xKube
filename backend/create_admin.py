#!/usr/bin/env python3
"""
Create initial admin user for xKube
Run this script once to create the first admin account
"""
import asyncio
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

from app.database import AsyncSessionLocal
from app.models.user import UserDB, AuthProvider
from app.services.user_repository import UserRepository
from app.services.auth_service import AuthService


async def create_admin():
    """Create admin user"""
    async with AsyncSessionLocal() as db:
        # Check if admin exists
        existing = await UserRepository.get_user_by_email(db, "admin@xkube.io")
        if existing:
            print("❌ Admin user already exists!")
            print(f"   Email: admin@xkube.io")
            return False
        
        # Create admin user
        admin_user = UserDB(
            email="admin@xkube.io",
            password_hash=AuthService.hash_password("admin123"),
            name="Admin User",
            auth_provider=AuthProvider.LOCAL,
            is_active=True,
            is_verified=True,
        )
        
        await UserRepository.create_user(db, admin_user)
        
        print("✅ Admin user created successfully!")
        print("")
        print("=" * 50)
        print("   Email:    admin@xkube.io")
        print("   Password: admin123")
        print("=" * 50)
        print("")
        print("⚠️  IMPORTANT: Change this password after first login!")
        return True


if __name__ == "__main__":
    asyncio.run(create_admin())
