# Orvia — Production-Ready API Platform

<div align="center">
  <img src="frontend/public/logo.png" alt="Orvia Logo" width="300" />
  <p><strong>A modern, high-performance API platform and management gateway.</strong></p>
</div>

---

## 🌟 Overview

**Orvia** is a centralized API platform designed to manage, monitor, and execute high-concurrency APIs with low latency. Built with an AMOLED-native dark design, async Python backend, and PostgreSQL with connection pooling.

### Key Capabilities
- **AMOLED-First Developer Interface**: Dedicated pure black (#000000) developer dashboard and public API catalogue.
- **Micro-Service Modular Architecture**: Add new API domains (e.g. image processing, social cards, file downloads) simply by adding isolated directories.
- **PostgreSQL Connection Pooling**: SQLAlchemy 2.0 with asynchronous psycopg 3 and pre-ping health checks against Neon serverless PostgreSQL.
- **Distributed Rate Limiting**: Sliding window counter algorithm with Redis caching and in-memory fallbacks.
- **Cryptographic API Key Management**: Fast indexed SHA-256 key hashing where plain secrets are displayed once and never stored unhashed.
- **Async Request Telemetry**: Background request logging with response timing, client IP tracking, status code tracking, and error capture.
- **Interactive API Console**: Integrated "Try It" playground with automatic cURL, JavaScript Fetch, and Python httpx code generation.

---

## 🛠 Technology Stack

### Frontend
- **Framework**: Next.js 15+ (App Router, Turbopack)
- **Language**: TypeScript 5.8+
- **Styling**: Tailwind CSS (Tailored AMOLED palette)
- **Component Primitives**: shadcn/ui design language
- **Icons**: Lucide Icons
- **State & Data Fetching**: TanStack React Query v5

### Backend
- **Framework**: FastAPI (Async I/O)
- **Language**: Python 3.13+
- **Validation**: Pydantic v2
- **ORM & Database**: SQLAlchemy 2.0+ with psycopg 3 (async)
- **Database Migrations**: Alembic
- **HTTP Client**: httpx with persistent connection pooling
- **Security**: bcrypt password hashing, PyJWT, SHA-256 tokens

---

## 🏛 Platform Architecture

```
                  ┌─────────────────────────────────────────┐
                  │          Next.js Frontend (AMOLED)      │
                  │  Public Portal  │  Admin Control Plane  │
                  └────────────────────┬────────────────────┘
                                       │ HTTP / REST
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │          FastAPI Gateway Engine         │
                  │  - Request ID & Telemetry Middleware    │
                  │  - Sliding Window Rate Limiter          │
                  │  - Cryptographic API Key Verification   │
                  └───────┬─────────────────────────┬───────┘
                          │                         │
            ┌─────────────┴───────────┐      ┌──────┴──────────────┐
            ▼                         ▼      ▼                     ▼
┌───────────────────────┐   ┌───────────────────────┐   ┌───────────────────────┐
│     Neon PostgreSQL   │   │     Redis / Memory    │   │  Async Reusable HTTP  │
│  - Users & Roles      │   │  - Sliding Rate Limits│   │  - Media Header Probe │
│  - Hashed API Keys    │   │  - Response Cache     │   │  - OpenGraph Scraper  │
│  - API Catalog Entries│   │  - Request Counters   │   └───────────────────────┘
│  - Request Logs       │   └───────────────────────┘
└───────────────────────┘
```

---

## 📦 Directory Structure

```
/root/api/
├── backend/
│   ├── alembic/                # Database migrations
│   ├── app/
│   │   ├── main.py             # FastAPI entrypoint, middleware, exception handlers
│   │   ├── core/
│   │   │   ├── config.py       # Pydantic settings & DB URL parser
│   │   │   ├── database.py     # SQLAlchemy 2.x async engine & session pool
│   │   │   ├── security.py     # bcrypt hashing, JWT, API key generation
│   │   │   ├── redis.py        # Redis client with in-memory fallback
│   │   │   ├── bootstrap.py    # Idempotent admin & catalog initializer
│   │   │   └── logging.py      # Structured JSON logging
│   │   ├── models/             # User, ApiKey, ApiService, RequestLog
│   │   ├── schemas/            # Pydantic v2 request/response models
│   │   ├── repositories/       # Database query abstraction
│   │   ├── services/           # Business logic & rate limiter
│   │   ├── middleware/         # Async request logging & header injection
│   │   ├── utils/              # Reusable pooled httpx client
│   │   ├── templates/          # Standardized API module template
│   │   └── api/
│   │       ├── router.py       # Main router (/api)
│   │       ├── dependencies.py # Auth, admin guard, rate limit dependency
│   │       └── v1/
│   │           ├── router.py   # Aggregated v1 sub-routers
│   │           ├── auth/       # Login, register, me
│   │           ├── admin/      # Health, settings
│   │           ├── users/      # User management
│   │           ├── api_keys/   # API key lifecycle
│   │           ├── services/   # Service catalog CRUD
│   │           ├── logs/       # Request logs & analytics
│   │           ├── utility/    # Health, QR code, IP, SHA hash
│   │           ├── image/      # Memory-safe resize & info
│   │           ├── media/      # Pooled header probe
│   │           └── social/     # OpenGraph scraper
│   ├── tests/                  # Automated pytest test suite
│   ├── Dockerfile
│   ├── requirements.txt
│   └── create_api_module.py    # CLI generator for new API modules
├── frontend/
│   ├── public/                 # Orvia official logo and favicon
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx      # Root layout (AMOLED black theme)
│   │   │   ├── page.tsx        # Public homepage & live test console
│   │   │   ├── apis/           # Public API directory & detail docs
│   │   │   ├── docs/           # Architecture guide & authentication
│   │   │   ├── login/          # Console login
│   │   │   └── admin/          # Dashboard, APIs, Logs, Keys, Health
│   │   ├── components/         # Navbar, Sidebar, Header, ApiTester
│   │   └── lib/                # Typed API client and utilities
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 🚀 Quickstart Guide

### 1. Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Run automated tests
pytest tests/test_api.py -v

# Start FastAPI development server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Frontend Setup

```bash
cd frontend

# Install packages
npm install

# Run development server
npm run dev

# Or compile production build
npm run build
npm start
```

Default credentials:
- **Email**: `admin@orvia.dev`
- **Password**: `OrviaAdmin2026!`

---

## ⚡ Adding New API Modules

Every API in Orvia is completely modular. You can scaffold a new module instantly:

```bash
cd backend
python create_api_module.py payments
```

This creates:
```
app/api/v1/payments/
├── __init__.py
├── router.py
├── schemas.py
├── service.py
├── dependencies.py
└── tests/
    └── test_payments.py
```

Then register the module in `app/api/v1/router.py`:
```python
from app.api.v1.payments.router import router as payments_router
api_v1_router.include_router(payments_router)
```

---

## 🐳 Docker Deployment

To launch the complete platform with backend, frontend, and Redis:

```bash
docker-compose up --build -d
```

Frontend will be accessible on port `3000`, and Backend on port `8000`.
