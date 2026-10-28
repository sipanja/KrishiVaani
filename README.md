# KrishiVaani AI (कृषिवाणी AI) 🌾
### Production-Grade, Multilingual Agricultural Voice & Intelligence Platform for Indian Farmers

[![CI Pipeline](https://github.com/souvik/KrishiVaani/actions/workflows/ci.yml/badge.svg)](https://github.com/souvik/KrishiVaani/actions)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![React 18](https://img.shields.io/badge/React-18.x-61dafb.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646cff.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-38bdf8.svg)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**KrishiVaani AI** is an end-to-end, full-stack agricultural voice intelligence platform built specifically for Indian smallholder farmers. It fuses real-time Indian language speech processing (STT & TTS), source-grounded agricultural knowledge retrieval from official Indian Council of Agricultural Research (**ICAR**) institutes and State Agricultural Universities (**SAU**), automated meteorological hazard monitoring (**IMD** criteria), and persistent longitudinal memory across crop seasons.

---

## 📑 Table of Contents
- [🌾 Core Capabilities](#-core-capabilities)
- [🌐 27 Indian Native Languages](#-27-indian-native-languages)
- [🏗️ System Architecture](#️-system-architecture)
- [📁 Repository Structure](#-repository-structure)
- [🚀 Quickstart: Local Development](#-quickstart-local-development)
- [🐳 Production Deployment (Docker Compose)](#-production-deployment-docker-compose)
- [🧪 Automated Test Suite](#-automated-test-suite)
- [📚 Documentation Index](#-documentation-index)
- [🔒 Security & Production Readiness](#-security--production-readiness)

---

## 🌾 Core Capabilities

### 1. Multimodal Voice Interaction (Gnani AI & WebAudio)
- **Regional Speech Recognition (Prisma STT):** High-accuracy speech-to-text tuned for noisy rural telephony and field microphone conditions.
- **Expressive Speech Synthesis (Timbre TTS):** Clear, dialect-appropriate speech synthesis in Hindi, English, and regional Indian languages.
- Real-time in-browser microphone recording with waveform visual feedback and automatic audio compression.

### 2. Generative Agronomic Reasoning (OpenRouter Flint LLM + ICAR RAG)
- Powered by `recursive/flint-v1.0:free` via OpenRouter with zero-hallucination guardrails.
- Grounds recommendations in official ICAR institutes (NRRI, IIWBR, CICR, DRMR, IIHR) and State Agricultural Universities (TNAU).
- **Integrated Pest Management (IPM):** Prioritizes non-chemical biological and cultural measures; strictly refuses unverified chemical dosage prescriptions.
- Clarifies ambiguous symptoms interactively before concluding diagnoses; refers high-uncertainty issues to local Krishi Vigyan Kendra (KVK) officers.

### 3. Hyper-Local IMD Weather Hazards & Auto-Geolocation
- Automatically detects farm GPS coordinates via browser geolocation with intelligent IP fallbacks.
- Fetches 7-day hyper-local forecasts and evaluates official **India Meteorological Department (IMD)** criteria:
  - **Heavy Rainfall Warning:** $\ge 64.5\text{ mm/day}$ — Triggers drainage advisories and fertilizer pause alerts.
  - **Heatwave Advisory:** $\ge 40^\circ\text{C}$ in plains — Alerts farmers to schedule evening irrigation and avoid midday leaf scorching.

### 4. Dynamic Crop Management ("Other" Crop Support)
- Manages full crop cycles for traditional Indian staples (Paddy, Wheat, Cotton, Mustard, Sugarcane, Tomato, Maize, Potato, etc.).
- Includes custom **"Other" Crop** registration, dynamically computing estimated duration, harvest windows, and growth stages based on agronomic category.

### 5. Persistent Farm Memory & Proactive Follow-Up Engine
- Schedules observation check-ins 2–3 days after a crop issue report.
- Adheres to farmer-configured **Quiet Hours** (e.g. 9:00 PM – 6:00 AM IST) so farmers are never disturbed at night.
- Reconciles farmer feedback ("Improved", "Same", "Worsened", "Resolved") into a historical issue timeline.

### 6. Strict No-Demo-Data Policy
- Zero hardcoded counts or fabricated dashboard feeds.
- First-time accounts initialize with a clean database and informative empty-state guides.

---

## 🌐 27 Indian Native Languages

KrishiVaani provides full native script and UI localization across 27 Indian languages:

| Group | Languages Supported |
|---|---|
| **Eighth Schedule Constitutional Languages** | Hindi (हिंदी), Bengali (বাংলা), Telugu (తెలుగు), Marathi (मराठी), Tamil (தமிழ்), Gujarati (ગુજરાતી), Punjabi (ਪੰਜਾਬੀ), Kannada (ಕನ್ನಡ), Malayalam (മലയാളം), Odia (ଓଡ଼ିଆ), Assamese (অসমীয়া), Urdu (اردو), Maithili (मैथिली), Sanskrit (संस्कृतम्), Konkani (कोंकणी), Nepali (नेपाली), Sindhi (سنڌي), Kashmiri (كٲشُر), Dogri (डोगरी), Manipuri (মৈতৈলোন্), Bodo (बड़ो), Santali (ᱥᱟᱱᱛᱟᱲᱤ) |
| **Regional Dialects & Indian English** | Bhojpuri (भोजपुरी), Marwari (मारवाड़ी), Chhattisgarhi (छत्तीसगढ़ी), Haryanvi (हरियाणवी), English (Indian Standard) |

Farmers can switch languages instantly with one click from the top navigation bar without losing form state or session data.

---

## 🏗️ System Architecture

```
                          ┌────────────────────────────────┐
                          │   Farmer Client (Mobile/Web)   │
                          │   React 18 + Tailwind CSS SPA  │
                          └──────────────┬─────────────────┘
                                         │ HTTPS / Reverse Proxy
                                         ▼
                          ┌────────────────────────────────┐
                          │     Nginx / Vite Gateway       │
                          └──────────────┬─────────────────┘
                                         │ WSGI
                                         ▼
                 ┌──────────────────────────────────────────────────┐
                 │       KrishiVaani Flask REST Backend             │
                 │                                                  │
                 │  ┌────────────────┐     ┌─────────────────────┐  │
                 │  │ API Endpoints  │◄───►│ JWT Authentication  │  │
                 │  └───────┬────────┘     └─────────────────────┘  │
                 │          │                                       │
                 │  ┌───────┴────────────────────────────────────┐  │
                 │  │             Service Layer                  │  │
                 │  │  • LLMService (OpenRouter / flint-v1.0)    │  │
                 │  │  • GnaniService (Prisma STT & Timbre TTS)  │  │
                 │  │  • AdvisoryService (ICAR/SAU Knowledge)    │  │
                 │  │  • WeatherService (IMD Hazard Engine)      │  │
                 │  │  • FollowUpEngine (APScheduler Worker)     │  │
                 │  └───────┬────────────────────────────────────┘  │
                 └──────────┼───────────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┬──────────────────────┐
            ▼               ▼               ▼                      ▼
    ┌──────────────┐ ┌──────────────┐ ┌──────────────┐    ┌────────────────┐
    │ OpenRouter   │ │ Gnani AI     │ │ Open-Meteo   │    │ Database       │
    │ AI Gateway   │ │ Voice API    │ │ IMD Weather  │    │ PostgreSQL     │
    │ (Flint Model)│ │ (Vachana)    │ │ Forecasts    │    │ / SQLite       │
    └──────────────┘ └──────────────┘ └──────────────┘    └────────────────┘
```

---

## 📁 Repository Structure

```
KrishiVaani/
├── backend/
│   ├── app/
│   │   ├── api/v1/            # Versioned REST APIs (auth, farms, crops, issues, voice, weather, followups, admin)
│   │   ├── models/            # SQLAlchemy Relational Models (User, Farm, CropCycle, CropIssue, etc.)
│   │   ├── services/          # LLMService, GnaniService, WeatherService, AdvisoryService, FollowUpEngine
│   │   ├── data/              # Verified ICAR/SAU agronomic knowledge package
│   │   ├── config.py          # Environment configs (development, testing, production)
│   │   └── __init__.py        # Flask application factory & APScheduler initialization
│   ├── migrations/            # Alembic schema migrations
│   ├── tests/                 # Comprehensive Pytest test suite (11 passing tests)
│   ├── wsgi.py                # WSGI entry point for Gunicorn
│   └── requirements.txt       # Production Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/        # Navbar, VoiceRecorderModal, LanguageModal, EmptyState, AudioPlayer
│   │   ├── pages/             # Dashboard, Farms, Assistant, CropHealth, Weather, FollowUps, Settings, Admin
│   │   ├── context/           # AuthContext (JWT session, state, multi-language)
│   │   ├── services/          # Axios/fetch typed API client
│   │   └── utils/             # 27 Indian native language dictionaries & geolocation
│   ├── vite.config.ts         # Vite build configuration with reverse proxy
│   ├── tailwind.config.js     # Responsive theme with Earth-tone agricultural palette
│   └── package.json
├── docs/                      # Technical Documentation
│   ├── ARCHITECTURE.md        # In-depth architectural & domain model specification
│   ├── API_DOCUMENTATION.md   # Exhaustive REST API reference with JSON payloads
│   └── DEPLOYMENT_GUIDE.md    # Production deployment manual (Docker, PaaS, SSL)
├── docker/
│   ├── Dockerfile.backend     # Python 3.11 slim + Gunicorn image
│   ├── Dockerfile.frontend    # Multi-stage Node.js build + Nginx alpine image
│   └── nginx.conf             # Production Nginx reverse proxy configuration
├── .github/workflows/
│   └── ci.yml                 # Automated CI/CD pipeline (Pytest + Frontend Build)
├── docker-compose.yml         # Multi-container production stack (PostgreSQL, Redis, Backend, Frontend)
├── .env.example               # Safe environment configuration template
└── .gitignore                 # Excludes secrets, venvs, and databases
```

---

## 🚀 Quickstart: Local Development

### Prerequisites
- **Python 3.11+**
- **Node.js 18+ & npm**
- **Git**

### 1. Clone the Repository
```bash
git clone https://github.com/<your-username>/KrishiVaani.git
cd KrishiVaani
```

### 2. Backend Setup
```bash
# 1. Create and activate a Python virtual environment
python3 -m venv .venv
source .venv/bin/activate

# 2. Install Python dependencies
pip install -r backend/requirements.txt

# 3. Create .env from template
cp .env.example .env

# 4. Run the Flask development server
python backend/wsgi.py
# Backend runs at http://localhost:5001 (or 5000)
```

### 3. Frontend Setup
```bash
# Open a new terminal
cd frontend

# 1. Install Node dependencies
npm install

# 2. Start the Vite dev server
npm run dev
# Frontend runs at http://localhost:5173
```

Navigate to `http://localhost:5173` in your browser.

---

## 🐳 Production Deployment (Docker Compose)

Deploy the entire production stack (Frontend Nginx, Gunicorn Backend, PostgreSQL, and Redis) with a single command:

```bash
# 1. Copy and configure production secrets
cp .env.example .env
nano .env

# 2. Build and launch all containers
docker compose up -d --build

# 3. Verify health
docker compose ps
```

Access points:
- **Web UI:** `http://<your-server-ip>/`
- **Backend Health:** `http://<your-server-ip>/api/v1/health/ready`

---

## 🧪 Automated Test Suite

Execute the comprehensive Pytest suite:
```bash
source .venv/bin/activate
export PYTHONPATH=backend
pytest backend/tests -v
```

### Passing Test Matrix (11 / 11 Passing):
- `test_empty_database_on_start`: Confirms zero mock records on fresh install.
- `test_user_registration_and_login`: Verifies Argon2/bcrypt password hashing & JWT tokens.
- `test_profile_update_and_me`: Validates farmer profile persistence and language preferences.
- `test_cross_user_isolation`: Proves strict tenant isolation across multiple farmers.
- `test_crop_issue_reporting_and_rag`: Tests ICAR disease matching and follow-up scheduling.
- `test_farm_and_crop_lifecycle`: Verifies full crop life cycles from sowing to harvest.
- `test_imd_rainfall_hazard_rules`: Verifies 64.5 mm/day heavy rain threshold triggers.
- `test_imd_heatwave_hazard_rules`: Verifies 40°C heatwave advisory calibration.
- `test_gnani_service_configuration`: Verifies voice provider credential verification.
- `test_voice_health_endpoint`: Tests STT/TTS pipeline readiness.
- `test_weather_auto_location_endpoint`: Tests GPS geolocation and weather forecast resolution.

---

## 📚 Documentation Index

For in-depth guides and references, consult the `docs/` directory:
- 🏛️ [**System Architecture (docs/ARCHITECTURE.md)**](docs/ARCHITECTURE.md): Complete data models, entity relationships, sequence diagrams, and design principles.
- 📡 [**REST API Documentation (docs/API_DOCUMENTATION.md)**](docs/API_DOCUMENTATION.md): Endpoint specifications, request parameters, JSON bodies, and status codes.
- 🚢 [**Production Deployment Guide (docs/DEPLOYMENT_GUIDE.md)**](docs/DEPLOYMENT_GUIDE.md): GitHub Secrets, Docker Compose, VPS provisioning, SSL setup, and cloud hosting.

---

## 🔒 Security & Production Readiness

- **Strict Secret Segregation:** All sensitive API keys (`OPENROUTER_API_KEY`, `GNANI_API_KEY`, `SECRET_KEY`) reside exclusively in `.env` and are strictly excluded from source control.
- **OWASP File Upload Security:** Filename UUID hashing, extension whitelisting, and path traversal prevention for all farmer field photos.
- **Cross-Tenant Isolation:** All database queries enforce `user_id = current_user.id`.
- **Responsive Layout Integrity:** Hardened CSS ensures zero element collisions, overlaps, or boundary overflows across all mobile, tablet, and 4K desktop screens.

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
# KrishiVaani
