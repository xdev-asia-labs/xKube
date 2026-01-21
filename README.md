<div align="center">

![xKube Banner](./frontend/public/banner.png)

# xKube

**Modern Kubernetes Management Platform**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://python.org)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109-green.svg)](https://fastapi.tiangolo.com)

[Features](#-features) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Contributing](#-contributing)

</div>

---

## ✨ Features

### 🎨 Modern UI/UX
- **Glass Morphism Design** - Beautiful, modern interface with x-ui component library
- **Dark Mode** - Eye-friendly dark theme by default
- **Responsive Layout** - Works on desktop, tablet, and mobile
- **Premium Sidebar** - Collapsible navigation with smooth animations

### ☸️ Kubernetes Management
- **Multi-Cluster Support** - Manage multiple K8s clusters from one dashboard
- **Real-time Metrics** - Live updates for pods, deployments, services
- **Resource Monitoring** - CPU, memory, network usage tracking
- **Pod Logs** - Stream and search container logs
- **Namespace Switching** - Easy context switching between namespaces

### 🔐 Authentication & Security
- **JWT Authentication** - Secure token-based auth
- **OAuth2 Integration** - Login with Google & GitHub
- **Role-Based Access** - Fine-grained permissions (coming soon)
- **Refresh Tokens** - Auto token rotation for security

### 💻 Developer Experience
- **Redux Toolkit** - Predictable state management
- **TypeScript** - Type-safe frontend code
- **Hot Reload** - Fast development with Vite
- **API Documentation** - Auto-generated OpenAPI docs at `/docs`

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- Kubernetes cluster (local or remote)
- kubectl configured

### Backend Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Run backend
uvicorn app.main:app --reload --port 8888
```

### Frontend Setup

```bash
cd frontend
npm install

# Configure environment
cp .env.example .env
# Edit .env if needed

# Run frontend
npm run dev
```

Visit **http://localhost:5173** 🎉

---

## 📦 Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| **FastAPI** | Modern async Python web framework |
| **kubernetes-client** | Official Kubernetes Python SDK |
| **python-jose** | JWT token handling |
| **bcrypt** | Password hashing |
| **uvicorn** | ASGI server |

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 18** | UI framework |
| **Vite** | Build tool & dev server |
| **Redux Toolkit** | State management |
| **x-ui** | Component library |
| **Tailwind CSS v4** | Styling |
| **React Query** | Server state |

---

## 🗂️ Project Structure

```
xKube/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── main.py         # Application entry
│   │   ├── api/            # API routes
│   │   │   ├── auth.py     # Auth endpoints
│   │   │   ├── clusters.py # Cluster management
│   │   │   └── pods.py     # Pod operations
│   │   ├── models/         # Data models
│   │   ├── services/       # Business logic
│   │   │   ├── auth_service.py
│   │   │   └── oauth_service.py
│   │   ├── db/             # Database layer
│   │   └── core/           # Config & utilities
│   └── requirements.txt
│
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── layout/    # Layout components
│   │   │   └── Logo.tsx   # Brand logo
│   │   ├── pages/         # Page components
│   │   ├── store/         # Redux store
│   │   │   └── slices/    # Redux slices
│   │   ├── contexts/      # React contexts
│   │   └── App.tsx        # Main app
│   ├── public/
│   │   └── banner.png     # README banner
│   └── package.json
│
└── packages/              # Monorepo packages
    └── x-ui/             # UI component library
        └── packages/
            ├── react/    # React components
            └── core/     # Core utilities
```

---

## 🔐 Authentication

xKube supports multiple authentication methods:

### Email/Password
1. Register with email and password
2. JWT access token (15min) + refresh token (7 days)
3. Auto token rotation

### OAuth2 Providers
- **Google** - Sign in with Google account
- **GitHub** - Sign in with GitHub account

**Note**: Configure OAuth credentials in `.env`:
```env
# Backend
XKUBE_GOOGLE_CLIENT_ID=your-google-client-id
XKUBE_GOOGLE_CLIENT_SECRET=your-secret

XKUBE_GITHUB_CLIENT_ID=your-github-client-id
XKUBE_GITHUB_CLIENT_SECRET=your-secret
```

---

## 📖 API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:8888/docs
- **ReDoc**: http://localhost:8888/redoc

### Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Register new user |
| `/api/auth/login` | POST | Login with credentials |
| `/api/auth/me` | GET | Get current user |
| `/api/auth/oauth/google` | GET | OAuth with Google |
| `/api/clusters` | GET | List clusters |
| `/api/pods` | GET | List pods |
| `/api/deployments` | GET | List deployments |

---

## 🛠️ Development

### Building x-ui Components

```bash
cd packages/x-ui/packages/react
pnpm install
pnpm build
```

### Environment Variables

**Backend** (`backend/.env`):
```env
XKUBE_JWT_SECRET_KEY=your-secret-key
XKUBE_FRONTEND_URL=http://localhost:5173
XKUBE_BACKEND_URL=http://localhost:8888
```

**Frontend** (`frontend/.env`):
```env
VITE_API_URL=http://localhost:8888
VITE_APP_NAME=xKube
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Kubernetes](https://kubernetes.io/) - Container orchestration
- [FastAPI](https://fastapi.tiangolo.com/) - Modern Python web framework
- [React](https://reactjs.org/) - UI library
- [Vite](https://vitejs.dev/) - Next generation frontend tooling
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS

---

<div align="center">

**Built with ❤️ by xDev Asia Labs**

[Report Bug](https://github.com/xdev-asia/xKube/issues) • [Request Feature](https://github.com/xdev-asia/xKube/issues)

</div>
