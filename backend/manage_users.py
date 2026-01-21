#!/usr/bin/env python3
"""
xKube User Management Script
Create and manage users for xKube platform
"""
import asyncio
import sys
from getpass import getpass

# Add parent directory to path
sys.path.insert(0, '.')

from app.db import db
from app.services.auth_service import AuthService
from app.models.user import UserDB, AuthProvider


async def create_user():
    """Interactive user creation"""
    print("=" * 50)
    print("xKube - Create New User")
    print("=" * 50)
    print()
    
    email = input("Email: ").strip()
    if not email:
        print("❌ Email is required")
        return
    
    # Check if user exists
    existing = await db.get_user_by_email(email)
    if existing:
        print(f"❌ User with email {email} already exists")
        return
    
    name = input("Full Name: ").strip()
    if not name:
        print("❌ Name is required")
        return
    
    password = getpass("Password (min 8 chars): ")
    password_confirm = getpass("Confirm Password: ")
    
    if password != password_confirm:
        print("❌ Passwords do not match")
        return
    
    if len(password) < 8:
        print("❌ Password must be at least 8 characters")
        return
    
    # Create user
    hashed_password = AuthService.hash_password(password)
    
    user = UserDB(
        email=email.lower(),
        name=name,
        password_hash=hashed_password,
        auth_provider=AuthProvider.LOCAL,
        is_verified=True  # Auto-verify for admin-created users
    )
    
    await db.create_user(user)
    
    print()
    print("✅ User created successfully!")
    print(f"   Email: {user.email}")
    print(f"   Name: {user.name}")
    print(f"   ID: {user.id}")
    print()


async def list_users():
    """List all users"""
    print("=" * 50)
    print("xKube - User List")
    print("=" * 50)
    print()
    
    users = await db.list_users()
    
    if not users:
        print("No users found")
        return
    
    print(f"Total users: {len(users)}")
    print()
    
    for i, user in enumerate(users, 1):
        print(f"{i}. {user.name}")
        print(f"   Email: {user.email}")
        print(f"   Provider: {user.auth_provider.value}")
        print(f"   Verified: {'✓' if user.is_verified else '✗'}")
        print(f"   Created: {user.created_at}")
        print()


async def delete_user():
    """Delete a user"""
    print("=" * 50)
    print("xKube - Delete User")
    print("=" * 50)
    print()
    
    email = input("Email to delete: ").strip()
    if not email:
        print("❌ Email is required")
        return
    
    user = await db.get_user_by_email(email)
    if not user:
        print(f"❌ User with email {email} not found")
        return
    
    print(f"\n⚠️  You are about to delete:")
    print(f"   Name: {user.name}")
    print(f"   Email: {user.email}")
    print(f"   ID: {user.id}")
    
    confirm = input("\nType 'DELETE' to confirm: ").strip()
    if confirm != "DELETE":
        print("❌ Deletion cancelled")
        return
    
    await db.delete_user(user.id)
    print("✅ User deleted successfully")


async def main():
    """Main menu"""
    while True:
        print()
        print("=" * 50)
        print("xKube User Management")
        print("=" * 50)
        print("1. Create new user")
        print("2. List all users")
        print("3. Delete user")
        print("4. Exit")
        print()
        
        choice = input("Select option (1-4): ").strip()
        
        if choice == "1":
            await create_user()
        elif choice == "2":
            await list_users()
        elif choice == "3":
            await delete_user()
        elif choice == "4":
            print("\n👋 Goodbye!")
            break
        else:
            print("❌ Invalid option")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n👋 Goodbye!")
        sys.exit(0)
