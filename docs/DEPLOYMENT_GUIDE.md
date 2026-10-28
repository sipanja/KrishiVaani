# KrishiVaani AI — Production Deployment Guide

This guide details how to prepare, deploy, and maintain KrishiVaani AI in production environments.

---

## 1. Preparing the GitHub Repository

### 1.1 Verify Repository Hygiene
Before pushing to GitHub, verify that no sensitive files or environment variables are tracked:

```bash
# Verify no .env or database files are staged
git status
git ls-files .env instance/

# Ensure tests and frontend build pass
pytest backend/tests -v
cd frontend && npm run build && cd ..
```

### 1.2 GitHub Repository Secrets
Navigate to your GitHub repository -> **Settings** -> **Secrets and variables** -> **Actions** -> **New repository secret**:

| Secret Name | Description | Example / Note |
|---|---|---|
| `SECRET_KEY` | Flask cryptographic session key | Run `python -c "import secrets; print(secrets.token_hex(32))"` |
| `OPENROUTER_API_KEY` | OpenRouter API Key for Flint LLM | `sk-or-v1-...` |
| `GNANI_API_KEY` | Gnani AI Speech Engine API key | `vach_...` |
| `DATABASE_URL` | Production PostgreSQL connection string | `postgresql://user:pass@host:5432/dbname` |

---

## 2. Option A: Production Multi-Container Deployment via Docker Compose

Recommended for VPS servers (DigitalOcean Droplet, AWS EC2, Linode, Hetzner, GCP Compute Engine).

### 2.1 Server Prerequisites
```bash
# Install Docker and Docker Compose
sudo apt-get update
sudo apt-get install -y docker.io docker-compose-plugin
sudo systemctl enable --now docker
```

### 2.2 Clone and Configure
```bash
git clone https://github.com/<your-username>/KrishiVaani.git /opt/krishivaani
cd /opt/krishivaani

# Generate production environment
cp .env.example .env
nano .env
```

Set the following in `.env`:
```ini
FLASK_ENV=production
SECRET_KEY=<your-generated-secure-random-token>
DATABASE_URL=postgresql://krishivaani:YourStrongDbPassword@postgres:5432/krishivaani_db
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=recursive/flint-v1.0:free
GNANI_API_KEY=your_gnani_key
POSTGRES_USER=krishivaani
POSTGRES_PASSWORD=YourStrongDbPassword
POSTGRES_DB=krishivaani_db
```

### 2.3 Launch Stack
```bash
# Build and run all services in detached mode
docker compose up -d --build

# Run database migrations inside backend container
docker compose exec backend flask db upgrade

# Verify service health
docker compose ps
```

The stack launches:
1. `krishivaani_frontend`: Nginx serving optimized React bundle and reverse-proxying `/api/` to backend.
2. `krishivaani_backend`: Gunicorn WSGI server running Flask on port 5000.
3. `krishivaani_postgres`: PostgreSQL 15 database with persistent volume.
4. `krishivaani_redis`: In-memory broker for cache and background queues.

---

## 3. Option B: Cloud PaaS Deployment (Render / Railway)

### 3.1 Deploying Backend on Render / Railway
1. **Repository:** Connect your GitHub repository.
2. **Root Directory:** Set to repository root or `backend`.
3. **Build Command:** `pip install -r backend/requirements.txt`
4. **Start Command:** `gunicorn -w 4 -b 0.0.0.0:$PORT backend.wsgi:app`
5. **Environment Variables:**
   - `FLASK_ENV=production`
   - `SECRET_KEY=<generated-key>`
   - `DATABASE_URL=<postgres-connection-url>`
   - `OPENROUTER_API_KEY=<openrouter-key>`
   - `GNANI_API_KEY=<gnani-key>`
   - `CORS_ORIGINS=https://<your-frontend-domain>`

### 3.2 Deploying Frontend on Vercel / Netlify
1. **Root Directory:** `frontend`
2. **Build Command:** `npm run build`
3. **Output Directory:** `dist`
4. **Environment Variables:**
   - `VITE_API_BASE_URL=https://<your-backend-domain>/api/v1`

---

## 4. SSL / TLS Setup with Nginx & Let's Encrypt Certbot

On your VPS host:
```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Certbot automatically configures HTTPS renewal cron jobs and updates Nginx configuration with TLS 1.3 certificates.

---

## 5. Automated CI/CD (GitHub Actions)

Every pull request or commit to `main` or `master` triggers `.github/workflows/ci.yml`:
1. **Backend Testing Job:** Installs dependencies, sets up testing environment, and executes `pytest backend/tests -v`.
2. **Frontend Typecheck & Build Job:** Sets up Node.js 20, runs `npm ci`, and validates `npm run build`.
