# Panorama SDG — IT Deployment Handoff
**Recipient**: Patrick (UIA IT Department)
**Prepared by**: UIA / Panorama SDG Project Team
**Date**: April 2026

---

## What You Are Receiving

The Panorama SDG web platform — an interactive global map of sustainable development projects curated by UIA for the 2030 Agenda.

**Deliverables handed over:**
| Item | How to receive |
|---|---|
| Source code | Git clone from GitHub (see Step 1) |
| Project images (~4 GB, 2,529 files) | Google Drive link (shared separately) |
| Database snapshot | Included in the repo: `data/sql/seed.sql` |
| This setup guide | `HANDOFF_PATRICK.md` in the repo root |

---

## Prerequisites — Install on the VM First

| Software | Version | Download |
|---|---|---|
| Docker Desktop | Latest | https://www.docker.com/products/docker-desktop |
| Git | Latest | https://git-scm.com/downloads |
| (Optional) VS Code | Any | For editing config files |

**VM requirements**: 8 GB RAM minimum, 20 GB free disk, internet access during setup.

No Python, Node.js, or database installation needed — everything runs in Docker.

---

## Step 1 — Clone the Repository

Open a terminal (PowerShell or CMD) and run:

```bash
git clone https://github.com/lucasnc-ops/UIA_Atlas_3-3.git atlas_33
cd atlas_33
```

---

## Step 2 — Configure Environment

```bash
copy backend\.env.example backend\.env
```

Open `backend\.env` in a text editor and set:

```
SECRET_KEY=<generate a random 32+ character string>
ADMIN_EMAIL=patrick@uia.archi
```

To generate a SECRET_KEY, you can use any password generator or run:
```bash
# In PowerShell:
[System.Web.Security.Membership]::GeneratePassword(40, 5)
```

**Everything else** (database, MinIO, ports) has working defaults — do not change unless needed.

---

## Step 3 — Start the Platform

```bash
docker compose up -d
```

This downloads and starts 5 services automatically:
- **PostgreSQL** — project database (port 5432)
- **MinIO** — image file storage (port 9000/9001)
- **FastAPI backend** — REST API (port 8080)
- **React frontend** — web interface (port 5173)
- **MinIO init** — creates the image bucket on first start

Wait ~60 seconds, then verify all services are running:

```bash
docker compose ps
```

All services should show `running` or `healthy`.

---

## Step 4 — Load the Project Database

```bash
docker exec -i atlas_33-db-1 psql -U postgres panorama_sdg < data\sql\seed.sql
```

This loads all 309 UIA Guidebook projects (2023 + 2026 editions) into the database.

Verify:
```bash
docker exec atlas_33-db-1 psql -U postgres panorama_sdg -c "SELECT COUNT(*) FROM projects;"
```
Expected result: `309` (or similar).

---

## Step 5 — Create Admin Account

```bash
docker exec atlas_33-backend-1 python scripts/create_admin.py
```

This creates the admin login:
- **Email**: `admin@panorama-sdg.org`
- **Password**: `Panorama2030!`

**Change these credentials** by editing `backend/scripts/create_admin.py` before running, or update them via the database afterwards.

---

## Step 6 — Upload Project Images

**6a.** Download the image archive from the Google Drive link provided by the project team.

**6b.** Extract the archive so the folder structure is:
```
atlas_33\
  frontend\
    public\
      project_images\      ← 2,529 files here, flat folder (no subfolders)
          01 - EFP1.webp
          P1_1.jpg
          ...
```

**6c.** Upload to MinIO (the internal image server):
```bash
# On Windows, run in Git Bash (not PowerShell):
bash scripts/seed_images_to_minio.sh
```

This uploads all images into the local MinIO bucket. Takes 5–15 minutes depending on disk speed.

Verify images are accessible:
```
http://localhost:9000/project-images/P1_1.jpg
```
Should display an image in the browser.

---

## Step 7 — Verify the Platform

Open in a browser:

| URL | What you should see |
|---|---|
| `http://localhost:5173` | Panorama SDG landing page |
| `http://localhost:5173/dashboard` | Interactive world map with project markers |
| `http://localhost:5173/admin` | Admin login page |
| `http://localhost:8080/docs` | Backend API documentation |
| `http://localhost:9001` | MinIO file browser (user: `minioadmin`, pass: `minioadmin`) |

Log in to the admin panel with the credentials from Step 5.

---

## Step 8 — Integrate with the UIA Domain

The platform runs internally on ports 5173 (frontend) and 8080 (API). To expose it on your existing UIA domain with HTTPS, configure your web server (nginx/IIS/Apache) as a reverse proxy.

### Example: nginx reverse proxy

```nginx
# Frontend (main site)
server {
    listen 443 ssl;
    server_name panorama.uia.archi;   # adjust to your subdomain

    ssl_certificate     /path/to/your/cert.pem;
    ssl_certificate_key /path/to/your/key.pem;

    location / {
        proxy_pass http://localhost:5173;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# API backend
server {
    listen 443 ssl;
    server_name api.panorama.uia.archi;   # adjust to your API subdomain

    ssl_certificate     /path/to/your/cert.pem;
    ssl_certificate_key /path/to/your/key.pem;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### After setting your domain, update these two values in `docker-compose.yml`:

```yaml
# In the frontend service environment block:
VITE_API_URL=https://api.panorama.uia.archi

# In the backend service environment block:
CORS_ORIGINS=https://panorama.uia.archi
```

Then restart:
```bash
docker compose up -d --build
```

---

## Day-to-Day Operations

### Start / stop the platform
```bash
docker compose up -d       # start
docker compose down        # stop (data is preserved)
```

### View logs
```bash
docker compose logs -f backend    # API logs
docker compose logs -f frontend   # Frontend logs
```

### Backup the database
```bash
docker exec atlas_33-db-1 pg_dump -U postgres panorama_sdg > backup_$(date +%Y%m%d).sql
```

### Restore a backup
```bash
docker exec -i atlas_33-db-1 psql -U postgres panorama_sdg < backup_20260420.sql
```

---

## Admin Panel Usage

1. Go to your domain (or `http://localhost:5173/admin`)
2. Log in with the credentials from Step 5
3. From the admin panel you can:
   - **Review** new project submissions from architects worldwide
   - **Approve** → project appears on the public map
   - **Reject** → submitter receives an email with your reason
   - **Request changes** → submitter receives a secure edit link

---

## Troubleshooting

**Services won't start**
```bash
docker compose logs    # check for error messages
docker compose ps      # check which service failed
```

**Database is empty**
```bash
# Re-run the seed step:
docker exec -i atlas_33-db-1 psql -U postgres panorama_sdg < data\sql\seed.sql
```

**Images not showing on the map**
```bash
# Confirm MinIO has the files:
# Open http://localhost:9001 → login → browse "project-images" bucket
# If empty, re-run Step 6c
```

**Port conflicts** (something already using 5173 or 8080)
Edit `docker-compose.yml` and change the left side of the port mapping:
```yaml
ports:
  - "5174:5173"   # change 5173 to any free port
```

---

## Contact & Support

For questions about the platform codebase, contact the Panorama SDG project team.
For UIA network/domain/certificate issues, handle within UIA IT infrastructure.

The complete technical documentation is in the repository:
- `README.md` — project overview and architecture
- `DOCKER_SETUP.md` — detailed technical setup reference
- `data/sql/image_manifest.csv` — maps all 2,478 images to their projects
