# xKube User Management

## Registration Policy

**Public registration is DISABLED** by default for security reasons.

Only administrators can create new user accounts.

---

## Admin Account

### Default Credentials (First Setup)

```
Email:    admin@xkube.io
Password: admin123
```

⚠️ **IMPORTANT**: Change this password immediately after first login!

---

## Creating New Users

Since public registration is disabled, there are two ways to create new users:

### Option 1: Create User via Script (Recommended for Admins)

1. Navigate to backend directory:
```bash
cd backend
source .venv/bin/activate
```

2. Run the create admin script (can be modified for regular users):
```bash
python create_admin.py
```

3. Or create a custom user script:
```python
import asyncio
from app.database import AsyncSessionLocal
from app.models.user import UserDB, AuthProvider
from app.services.user_repository import UserRepository
from app.services.auth_service import AuthService

async def create_user():
    async with AsyncSessionLocal() as db:
        user = UserDB(
            email="user@example.com",
            password_hash=AuthService.hash_password("secure_password"),
            name="User Name",
            auth_provider=AuthProvider.LOCAL,
            is_active=True,
            is_verified=True,
        )
        await UserRepository.create_user(db, user)
        print(f"✅ User created: {user.email}")

asyncio.run(create_user())
```

### Option 2: Enable Registration Temporarily

If you need to allow self-registration temporarily:

1. Set environment variable:
```bash
export XKUBE_ALLOW_REGISTRATION=true
```

2. Or modify `backend/app/core/config.py`:
```python
allow_registration: bool = True  # Temporarily enable
```

3. Restart backend server

4. Users can register via UI or API:
```bash
curl -X POST http://localhost:8888/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "securepass123",
    "name": "New User"
  }'
```

5. **Don't forget to disable registration again after creating users!**

---

## OAuth Options (Alternative)

Instead of local accounts, you can enable OAuth providers:

### Google OAuth
```bash
export XKUBE_GOOGLE_CLIENT_ID="your-client-id"
export XKUBE_GOOGLE_CLIENT_SECRET="your-client-secret"
```

### GitHub OAuth
```bash
export XKUBE_GITHUB_CLIENT_ID="your-client-id"
export XKUBE_GITHUB_CLIENT_SECRET="your-client-secret"
```

Users with OAuth enabled will be created automatically on first login.

---

## User Management API

### List all users (Admin only - to be implemented)
```bash
GET /api/users/
```

### Delete user (Admin only - to be implemented)
```bash
DELETE /api/users/{user_id}
```

### Update user (Admin only - to be implemented)
```bash
PUT /api/users/{user_id}
```

---

## Security Best Practices

1. ✅ Keep `allow_registration = False` in production
2. ✅ Use strong passwords (minimum 8 characters)
3. ✅ Change default admin password immediately
4. ✅ Consider using OAuth for better security
5. ✅ Regularly audit user accounts
6. ✅ Use HTTPS in production
7. ✅ Rotate JWT secrets periodically

---

## Database

Users are stored in PostgreSQL database in the `users` table with the following structure:

- `id` - UUID (Primary Key)
- `email` - Unique email address
- `name` - User's full name
- `hashed_password` - Bcrypt hashed password
- `avatar_url` - Optional profile picture
- `is_active` - Account status
- `is_superuser` - Admin privileges (future use)
- `created_at` - Timestamp
- `updated_at` - Timestamp

---

## Troubleshooting

### "Registration is disabled" error
This is expected! Contact your administrator to create an account.

### Lost admin password
Run the `create_admin.py` script again. It will fail if admin exists, so you may need to:
1. Connect to PostgreSQL: `psql -U postgres -d xkube`
2. Delete existing admin: `DELETE FROM users WHERE email = 'admin@xkube.io';`
3. Re-run `python create_admin.py`

### Need to reset all users
```sql
TRUNCATE users CASCADE;
```
Then re-run `create_admin.py` to recreate admin.
