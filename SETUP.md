# xKube - Quick Start Guide

## 🚀 First Time Setup

### 1. Start the Application

```bash
# Start database (if using Docker)
docker-compose up -d postgres

# Start Backend
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8888

# Start Frontend (separate terminal)
cd frontend
npm run dev
```

### 2. Create Admin Account

```bash
cd backend
source .venv/bin/activate
python create_admin.py
```

**Default Login:**
- Email: `admin@xkube.io`
- Password: `admin123`

⚠️ **Change this password after first login!**

### 3. Access the Application

Open http://localhost:5173 and login with admin credentials.

---

## 📝 Important Notes

### Registration is Disabled
- Public user registration is **disabled by default**
- Only admins can create new accounts via script
- See [USER_MANAGEMENT.md](./USER_MANAGEMENT.md) for details

### Database Migration Complete
- ✅ Authentication migrated from JSON to PostgreSQL
- ✅ All users must be created in PostgreSQL
- ✅ Old JSON database (`data/db.json`) is no longer used

---

## 🔐 Security

### Production Checklist
- [ ] Change default admin password
- [ ] Set strong `XKUBE_JWT_SECRET_KEY` in environment
- [ ] Set `ENCRYPTION_KEY` for kubeconfig encryption
- [ ] Enable HTTPS/TLS
- [ ] Configure proper CORS origins
- [ ] Set `XKUBE_ALLOW_REGISTRATION=false` (already default)

### Environment Variables

Create `.env` file in backend directory:

```bash
# Database
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/xkube

# Security
ENCRYPTION_KEY=your-32-byte-base64-key
XKUBE_JWT_SECRET_KEY=your-secret-key-here

# Registration (optional, defaults to false)
XKUBE_ALLOW_REGISTRATION=false

# OAuth (optional)
XKUBE_GOOGLE_CLIENT_ID=your-google-client-id
XKUBE_GOOGLE_CLIENT_SECRET=your-google-secret
XKUBE_GITHUB_CLIENT_ID=your-github-client-id
XKUBE_GITHUB_CLIENT_SECRET=your-github-secret

# URLs
XKUBE_FRONTEND_URL=http://localhost:5173
XKUBE_BACKEND_URL=http://localhost:8888
```

---

## 📖 Documentation

- [User Management Guide](./USER_MANAGEMENT.md) - How to create/manage users
- [Walkthrough](./walkthrough.md) - Authentication fix documentation (if exists)

---

## 🛠️ Development

### Backend
```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8888
```

### Frontend
```bash
cd frontend
npm run dev
```

### Database Migrations
```bash
# The app automatically creates tables on startup
# To manually reset database:
psql -U postgres -d xkube -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
```

---

## 🐛 Troubleshooting

### Can't login
1. Check if backend is running on port 8888
2. Check browser console for errors
3. Clear `localStorage`: Open DevTools Console → `localStorage.clear()` → Reload

### "Registration is disabled" error
This is expected! Admin must create accounts via `create_admin.py` script.

### Database connection error
1. Check PostgreSQL is running: `psql -U postgres -l`
2. Check `DATABASE_URL` in environment
3. Create database if needed: `createdb -U postgres xkube`

### Token errors / Authentication issues
1. Clear localStorage: `localStorage.clear()` in browser console
2. Logout and login again
3. Check JWT secret hasn't changed (would invalidate all tokens)

---

## 📞 Support

For issues or questions, please check:
1. This README
2. `USER_MANAGEMENT.md` for user account questions
3. Backend logs for API errors
4. Browser console for frontend errors
