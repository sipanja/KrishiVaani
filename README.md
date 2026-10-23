# KrishiVaani AI (कृषिवाणी AI)
### Production-Ready, Multilingual Agricultural Voice Agent for Indian Farmers

KrishiVaani AI is an end-to-end, production-grade agricultural voice platform built for Indian farmers. It combines real-time Indian language speech processing (Gnani AI Prisma STT & Timbre TTS), source-grounded agricultural knowledge retrieval (ICAR and State Agricultural Universities), and automated IMD meteorological hazard monitoring with persistent memory across farming cycles.

---

## 🌾 Core Capabilities

1. **Multilingual Speech-to-Text & Speech Synthesis**
   - Direct integration with **Gnani AI** (`https://api.vachana.ai`):
     - **Prisma STT (`/stt/v3`)**: High-accuracy regional Indian speech recognition for noisy rural telephony and microphone environments.
     - **Timbre TTS (`/api/v1/tts/inference`)**: Expressive, natural text-to-speech synthesis in Hindi, English, and regional Indian languages.
2. **Zero Hallucination Agricultural Guidance (ICAR & SAU RAG)**
   - Evidence-grounded disease diagnosis and IPM (Integrated Pest Management) cultural/biological recommendations from official ICAR institutes (NRRI, IIWBR, CICR, DRMR, IIHR) and State Agricultural Universities (TNAU).
   - Generates clarifying diagnostic questions when symptoms are ambiguous; refuses unverified chemical dosage prescriptions.
   - Recommends physical inspection by local Krishi Vigyan Kendra (KVK) or Block Agriculture Officers for high-uncertainty issues.
3. **Real-Time Meteorological Intelligence & IMD Hazard Alerts**
   - Hyper-local forecast for registered farm coordinates.
   - Evaluates official **India Meteorological Department (IMD)** hazard criteria:
     - Heavy rainfall (&ge; 64.5 mm/day) & extreme rainfall warnings.
     - Heat stress & heatwaves (&ge; 40°C in plains).
   - Deduplicated alerts with validity windows, source attribution, and stale-data indicators.
4. **Persistent Farm Memory & Proactive Follow-Up Engine**
   - Automatically schedules observation check-ins 2–3 days after a farmer reports crop symptoms.
   - Enforces farmer-configured quiet hours (e.g. 9 PM – 6 AM IST).
   - Syncs farmer feedback ("Improved", "Same", "Worsened", "Resolved") directly into the persistent crop issue timeline.
5. **Strict No-Demo-Data Policy**
   - Zero hardcoded counts or fabricated dashboard feeds.
   - The application starts with an empty database on first launch and renders useful empty states.

---

## 🏗️ Technology Architecture

```
KrishiVaani/
├── backend/
│   ├── app/
│   │   ├── api/v1/            # Versioned REST APIs (auth, farms, crops, issues, voice, weather, follow-ups)
│   │   ├── models/            # SQLAlchemy Relational Models (User, Farm, CropCycle, CropIssue, etc.)
│   │   ├── services/          # GnaniService, WeatherService, AdvisoryService, FollowUpEngine
│   │   ├── data/              # Verified ICAR/SAU agricultural knowledge package
│   │   ├── config.py          # Development, Testing, and Production configurations
│   │   └── __init__.py        # Flask app factory, APScheduler background worker
│   ├── migrations/            # Alembic schema migrations (001_initial_schema.py)
│   ├── tests/                 # Comprehensive pytest test suite (10/10 passing)
│   ├── wsgi.py                # WSGI entrypoint for Gunicorn
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/        # Navbar, VoiceRecorderModal, AudioPlayerButton, EmptyState
│   │   ├── pages/             # Landing, Auth, Onboarding, Dashboard, Farms, Assistant, CropHealth, Weather, FollowUps, Settings, Admin
│   │   ├── context/           # AuthContext (JWT session, Hindi/English toggle)
│   │   ├── services/          # Type-safe API client
│   │   └── utils/             # Bilingual translations dictionary
│   ├── vite.config.ts         # Vite build configuration with backend reverse proxy
│   └── tailwind.config.js     # Agricultural Earth-tone color palette
├── docker/
│   ├── Dockerfile.backend     # Python 3.11 slim + Gunicorn
│   ├── Dockerfile.frontend    # Multi-stage Node.js build + Nginx
│   └── nginx.conf             # Production Nginx reverse proxy configuration
├── docker-compose.yml         # Multi-container production stack (PostgreSQL, Redis, Backend, Frontend)
├── .env.example               # Safe configuration template
└── .gitignore                 # Prevents committing secrets, venvs, and databases
```

---

## 🚀 Quickstart: Local Development

### 1. Prerequisites
- Python 3.11+
- Node.js 18+ & npm
- Git

### 2. Backend Setup
```bash
# 1. Create and activate Python virtual environment
python3 -m venv .venv
source .venv/bin/activate

# 2. Install backend dependencies
pip install -r backend/requirements.txt

# 3. Create your .env file
cp .env.example .env
# Edit .env and enter your GNANI_API_KEY and SECRET_KEY

# 4. Run database migrations
cd backend
flask db upgrade
cd ..

# 5. Run backend development server
python backend/wsgi.py
# Backend runs at http://localhost:5000
```

### 3. Frontend Setup
```bash
# Open a new terminal
cd frontend

# 1. Install dependencies
npm install

# 2. Start Vite development server
npm run dev
# Frontend runs at http://localhost:5173
```

---

## 🐳 Production Deployment via Docker Compose

```bash
# 1. Copy environment template and configure secrets
cp .env.example .env

# Edit .env with production database credentials, GNANI_API_KEY, and strong SECRET_KEY:
# GNANI_API_KEY=vach_...
# SECRET_KEY=your_production_random_secret_key
# POSTGRES_PASSWORD=your_secure_db_password

# 2. Build and launch all services
docker compose up -d --build

# 3. Check service health
docker compose ps
```

The application will be accessible at:
- **Web Interface:** `http://<your-server-ip>/`
- **Backend API:** `http://<your-server-ip>/api/v1/health/ready`

---

## 🧪 Automated Testing

Run the comprehensive Pytest suite:
```bash
source .venv/bin/activate
export PYTHONPATH=backend
pytest backend/tests -v
```

### Test Coverage Highlights:
- `test_empty_database_on_start`: Validates zero mock records on clean launch.
- `test_user_registration_and_login`: Verifies password hashing and JWT token issuance.
- `test_cross_user_isolation`: Confirms User A cannot read or modify User B's farms/crops.
- `test_crop_issue_reporting_and_rag`: Tests ICAR RAG disease matching and follow-up scheduling.
- `test_imd_rainfall_hazard_rules`: Verifies 64.5 mm/day heavy rainfall alert triggering.
- `test_imd_heatwave_hazard_rules`: Verifies 40°C heatwave advisory calibration.
- `test_gnani_service_configuration`: Verifies voice provider credential verification.

---

## 💾 Database Backup & Disaster Recovery

### PostgreSQL Backup (Production)
```bash
# Create timestamped SQL dump
docker exec -t krishivaani_postgres pg_dump -U krishivaani krishivaani_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

### PostgreSQL Restoration
```bash
# Restore from backup dump
cat backup_YYYYMMDD_HHMMSS.sql | docker exec -i krishivaani_postgres psql -U krishivaani -d krishivaani_db
```

---

## 🔑 Environment Configuration Reference

| Variable | Description | Example / Default |
|---|---|---|
| `FLASK_ENV` | Environment mode (`development`, `testing`, `production`) | `production` |
| `SECRET_KEY` | Application secret key for session & token encryption | `a_secure_random_hex_string` |
| `DATABASE_URL` | SQLAlchemy connection string | `postgresql://user:pass@db:5432/dbname` |
| `GNANI_API_KEY` | Gnani AI API Key (`X-API-Key-ID`) | `vach_...` |
| `GNANI_BASE_URL` | Gnani AI Base Endpoint | `https://api.vachana.ai` |
| `UPLOAD_FOLDER` | Directory for uploaded crop photos | `backend/uploads` |
| `QUIET_HOURS_START` | Quiet hours start hour (24h IST) | `21` (9:00 PM) |
| `QUIET_HOURS_END` | Quiet hours end hour (24h IST) | `6` (6:00 AM) |
| `ENABLE_BACKGROUND_SCHEDULER` | Runs periodic follow-up checker | `true` |

---

## 🔒 Security Best Practices Implemented
- **No Committed Secrets:** API keys and credentials are strictly excluded via `.gitignore`.
- **JWT Cryptography:** Standard HS256 tokens with string subject claims and bounded expiration.
- **Cross-Tenant Isolation:** Database queries enforce ownership checks (`user_id = current_user.id`).
- **File Upload Protection:** Filename sanitization, UUID prefixing, MIME extension whitelist, and strict path traversal checks.
- **Audit Trails:** Administrative and security operations logged with IP and UTC timestamp.
