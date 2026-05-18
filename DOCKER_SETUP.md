# Docker Setup — Fresh VM Guide

Step-by-step instructions for deploying Panorama SDG on a new machine.

## Prerequisites

- Docker Engine + Compose v2 (Linux VM) — see install instructions below
- Git
- 8 GB RAM recommended (PostgreSQL + MinIO + FastAPI + Vite)
- Port availability: 5173 (frontend), 8080 (backend API), 9000/9001 (MinIO)

---

## 0. Install Docker Engine on a fresh Ubuntu/Debian VM

Skip this step if Docker is already installed (`docker --version`).

```bash
# Install Docker Engine (Ubuntu 22.04 / 24.04)
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io \
  docker-buildx-plugin docker-compose-plugin
# Allow running docker without sudo (re-login required after this)
sudo usermod -aG docker $USER
```

Verify: `docker --version` and `docker compose version`

---

## 1. Clone the repository

```bash
git clone https://github.com/lucasnc-ops/UIA_Atlas_3-3.git atlas_33
cd atlas_33
```

## 2. Configure environment

```bash
# Root env (MinIO credentials, optional overrides)
cp .env.example .env

# Backend env (JWT secret + email)
cp backend/.env.example backend/.env
```

Open `backend/.env` and set at minimum:

| Variable | What to set |
|---|---|
| `SECRET_KEY` | Any long random string (e.g. `openssl rand -hex 32`) |
| `ADMIN_EMAIL` | Where submission notifications go |

Everything else has working defaults for local Docker development. You do **not** need to touch the root `.env` unless you want to change MinIO or PostgreSQL passwords.

> **Container naming note:** Docker Compose names containers using the **parent folder name**.
> If you cloned into `atlas_33/` the containers are `atlas_33-db-1`, `atlas_33-backend-1`, etc.
> If you cloned into `Panorama_SDGs/` they are `panorama_sdgs-db-1`, etc.
> Adjust all `docker exec` commands below to match, or check with `docker compose ps`.

## 3. Start the stack

```bash
docker compose up -d
```

This starts: PostgreSQL 17, MinIO, MinIO init (bucket creation), FastAPI backend, Vite frontend.

Wait ~30 seconds for all services to be healthy:

```bash
docker compose ps        # all should show "healthy" or "running"
docker compose logs -f   # watch for errors
```

## 4. Load the database

```bash
# Restore the full project database
docker exec -i atlas_33-db-1 psql -U postgres panorama_sdg < data/sql/seed.sql
```

This loads all 309 approved projects (2023 + 2026 Guidebook editions).

## 4b. Create admin account

The seed restores project data only — run this to create the admin login:

```bash
docker exec atlas_33-backend-1 python scripts/create_admin.py
```

This creates the admin account with:
- **Email**: `admin@panorama-sdg.org`
- **Password**: `Panorama2030!`

Change these in `backend/scripts/create_admin.py` before running if you want different credentials.

## 5. Upload project images to MinIO

Images are **not stored in git** (too large). They are delivered separately as an archive.

### 5a. Receive the image archive

The UIA project team will provide a `.zip` or shared drive folder named `project_images/`.
Extract it so the path is:

```
atlas_33/
└── frontend/
    └── public/
        └── project_images/     ← 2,529 files, flat folder (no subfolders)
            ├── 01 - EFP1.webp
            ├── P1_1.jpg
            └── ...
```

### 5b. Verify the archive

Cross-reference with the manifest: `data/sql/image_manifest.csv`

```bash
# Count files in the archive
ls frontend/public/project_images/ | wc -l
# Expected: ~2,529 files

# Check a few entries against the manifest
head -5 data/sql/image_manifest.csv
```

The manifest columns are: `external_code, project_name, city, country, image_url, display_order`

### 5c. Upload to MinIO

```bash
bash scripts/seed_images_to_minio.sh
```

This uploads all files into the MinIO `project-images` bucket with public read access.
Images will then be served at `http://localhost:9000/project-images/<filename>`.

Without images the map and detail panel still work — images just won't display in the project cards.

## 6. Open the app

- **Public map**: http://localhost:5173/dashboard
- **Submit a project**: http://localhost:5173/submit
- **Admin panel**: http://localhost:5173/admin (use your `ADMIN_API_KEY`)
- **API docs**: http://localhost:8080/docs
- **MinIO console**: http://localhost:9001 (use MinIO credentials from `.env`)

---

## Image Archive — Naming Convention

The image filenames encode the project they belong to. No renaming is needed.

| Edition | Format | Example |
|---|---|---|
| 2023 Guidebook | `<description> - <CODE>.webp` | `01 - EFP1.webp`, `DSCF2847 - IFF10.webp` |
| 2026 Guidebook | `<CODE>_<originalname>.jpg` | `P1_1.jpg`, `P10_DJI_0030.jpg` |

Codes map to projects as follows:
- `EFP*` — 2023 European Future Projects
- `IFF*` — 2023 International Future Forum
- `LDP*` — 2023 Local Development Projects  
- `P1`–`P175` — 2026 Guidebook selected projects

The file `data/sql/image_manifest.csv` maps every image file to its project code, name, city, and country — use it to audit completeness or re-import images if needed.

---

---

## Production security checklist

Complete these steps before exposing the app to the public internet:

| Item | Action |
|------|--------|
| Admin API key | Set a strong random value: `openssl rand -hex 32` → paste into `ADMIN_API_KEY` in `.env` |
| JWT secret | Set a strong random value: `openssl rand -hex 32` → paste into `SECRET_KEY` in `backend/.env` |
| MinIO credentials | Change `MINIO_ROOT_USER` and `MINIO_ROOT_PASSWORD` from the defaults in `.env` |
| Default admin password | Edit `backend/scripts/create_admin.py` to change `Panorama2030!` **before** running step 4b |
| CORS origins | Set `CORS_ORIGINS` and `CORS_ORIGIN_REGEX` in `.env` to your actual domain |
| IMAGE_BASE_URL | Set to your public MinIO URL (e.g. `https://minio.your-domain.org/project-images`) |
| VITE_API_URL | Set in `frontend/.env` to your backend domain (e.g. `https://api.your-domain.org`) |

---

## Firewall (ufw)

```bash
sudo ufw allow 22        # SSH — keep this open or you'll be locked out
sudo ufw allow 80        # HTTP  (needed if using a reverse proxy like Nginx/Caddy)
sudo ufw allow 443       # HTTPS (needed if using a reverse proxy)
# Development/direct access only — block these in production:
sudo ufw allow 5173      # Vite frontend
sudo ufw allow 8080      # FastAPI backend
sudo ufw allow 9000      # MinIO API
sudo ufw allow 9001      # MinIO console
sudo ufw enable
```

> **Production recommendation:** Put Nginx or Caddy in front (ports 80/443) and block
> ports 5173, 8080, 9000, 9001 from the public internet.

---

## Stopping and restarting

```bash
docker compose down        # stop (keeps data volumes)
docker compose up -d       # restart
docker compose down -v     # DANGER: also deletes database volume
```

**Important**: always use `docker compose up -d` to restart, not `docker restart <container>`.
`docker restart` loses the Docker network, breaking inter-container communication.

---

## Updating to a new version

```bash
git pull origin main
docker compose build       # rebuild images if Dockerfile or requirements changed
docker compose up -d       # rolling restart — keeps DB/MinIO volumes intact
```

> Use `docker compose build --no-cache` if you want a fully clean rebuild (slower).
> Migrations run automatically on backend startup via `alembic upgrade head`.

---

## Admin access

The admin panel uses a single API key — no user accounts or passwords to manage.

1. Go to http://localhost:5173/admin
2. Enter the value of `ADMIN_API_KEY` from your `.env`
3. You're in

From the admin panel you can: review submissions, approve/reject/request changes, view all projects.

---

## Troubleshooting

**Backend can't reach database**
```bash
docker compose logs backend   # look for "connection refused"
docker compose ps             # check db is healthy
```

**MinIO images not loading**
```bash
# Verify bucket is public
docker run --rm --network atlas_33_default minio/mc \
  alias set local http://minio:9000 atlas_minio atlas_minio_pass
docker run --rm --network atlas_33_default minio/mc \
  anonymous get local/project-images
# Should show: Access permission for `local/project-images` is `public`
```

**Database is empty after restore**
```bash
docker exec -it atlas_33-db-1 psql -U atlas_user atlas_db \
  -c "SELECT COUNT(*) FROM projects;"
# Should return ~309
```

**Images missing from project cards**
```bash
# Confirm files were uploaded to MinIO
docker run --rm --network atlas_33_default minio/mc \
  alias set local http://minio:9000 atlas_minio atlas_minio_pass
docker run --rm --network atlas_33_default minio/mc \
  ls local/project-images | wc -l
# Should show ~2,529 files
```
