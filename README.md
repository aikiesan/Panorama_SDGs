# Panorama SDG

Interactive global map of sustainable development projects curated by the **Union of International Architects (UIA)** for the UN 2030 Agenda.

## Overview

Panorama SDG maps and showcases architecture and urban innovation projects that contribute to the UN Sustainable Development Goals (SDGs). The platform supports the UIA 3+3 initiative — tracking projects across the 2023 and 2026 Guidebook editions alongside community submissions.

### Key Features

- **3-tier interactive map** — 2026 Guidebook selected (solid markers), 2023 Guidebook selected (dashed markers), community submissions (gray dots)
- **SDG analytics** — real-time stats on SDG distribution, regional breakdown, and project momentum
- **Public submission portal** — architects worldwide can submit projects for UIA review
- **Admin review workflow** — approve, reject, or request changes via API key authentication
- **Deep linking** — shareable URLs per project (`/?project=<id>`)

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS |
| Maps | Leaflet + react-leaflet + Leaflet.markercluster |
| Charts | Recharts |
| Backend | FastAPI (Python 3.11) + SQLAlchemy 2.0 |
| Database | PostgreSQL 17 |
| Image storage | MinIO (S3-compatible, self-hosted) |
| Auth | Single admin API key (`X-Admin-Key` header) |

---

## Quick Start

Requires Docker Desktop and Git.

```bash
git clone https://github.com/lucasnc-ops/UIA_Atlas_3-3.git atlas_33
cd atlas_33
cp .env.example .env          # set ADMIN_API_KEY at minimum
docker compose up -d
# Wait ~30s for services to be healthy
docker exec -i atlas_33-db-1 psql -U postgres panorama_sdg < data/sql/seed.sql
docker exec atlas_33-backend-1 python scripts/create_admin.py
open http://localhost:5173    # or navigate in browser
```

Admin panel: http://localhost:5173/admin — enter your `ADMIN_API_KEY`.

For full setup instructions including image upload see [DOCKER_SETUP.md](DOCKER_SETUP.md).

---

## Environment Variables

See [`.env.example`](.env.example) for the full list. Minimum required:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `ADMIN_API_KEY` | Admin panel password (any strong string) |
| `IMAGE_BASE_URL` | Base URL for project images (MinIO public endpoint) |
| `VITE_API_URL` | Backend API URL seen by the browser |
| `VITE_IMAGE_BASE_URL` | Image base URL seen by the browser |

---

## Services (docker compose)

| Service | Port | Description |
|---|---|---|
| `frontend` | 5173 | React/Vite app |
| `backend` | 8080 | FastAPI (API docs: /docs) |
| `db` | 5432 | PostgreSQL 17 |
| `minio` | 9000 | Object storage (images) |
| `minio-init` | — | Creates bucket on first start |
| MinIO Console | 9001 | Browser UI for MinIO |

---

## Project Images

Images are **not stored in git**. They are delivered as a separate archive by the UIA project team.

### Archive structure

A flat folder of 2,529 files — no subfolders:

```
project_images/
├── 01 - EFP1.webp          ← 2023 Guidebook (.webp, ~1,299 files)
├── DSCF2847 - IFF10.webp
├── P1_1.jpg                ← 2026 Guidebook (.jpg, ~1,230 files)
├── P10_DJI_0030.jpg
└── ...
```

### Filename convention

| Edition | Pattern | Example |
|---|---|---|
| 2023 (EFP/IFF/LDP) | `<description> - <CODE>.webp` | `01 - EFP1.webp` |
| 2026 (P1–P175) | `<CODE>_<originalname>.jpg` | `P1_1.jpg` |

### Uploading to MinIO

```bash
# Extract archive to frontend/public/project_images/, then:
bash scripts/seed_images_to_minio.sh
```

The file `data/sql/image_manifest.csv` maps every image to its project code, name, city, and country — use it to audit completeness or recover from partial uploads.

---

## Data Sources

| Edition | Count | Code format | Notes |
|---|---|---|---|
| UIA Guidebook 2023 | 163 selected | `EFP-*`, `IFF-*`, `LDP-*` | With images (.webp) |
| UIA Guidebook 2026 | 125 selected (with coords) | `P1`–`P175` | With images (.jpg) |
| Community submissions | varies | UUID | Submitted via public form, pending review |

Import scripts: `backend/scripts/` and `scripts/`.

---

## Admin Workflow

1. A user submits a project at `/submit`
2. Admin logs in at `/admin` with the API key
3. Admin reviews and can:
   - **Approve** → project appears on the public map
   - **Reject** → submitter receives an email with the reason
   - **Request changes** → submitter gets a one-time edit link via email
4. Submitter edits and resubmits → back to review queue

---

## Project Structure

```
atlas_33/
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI routers (projects, dashboard, admin)
│   │   ├── core/         # Config, DB, deps, storage
│   │   ├── models/       # SQLAlchemy models
│   │   └── schemas/      # Pydantic schemas
│   ├── alembic/          # DB migrations
│   ├── scripts/          # Import, seed, and maintenance scripts
│   └── tests/            # pytest test suite (47 tests, 80% coverage)
├── frontend/
│   └── src/
│       ├── components/   # Shared UI components
│       ├── pages/        # Route-level pages
│       ├── services/api/ # API clients
│       └── hooks/        # React hooks
├── scripts/              # Shell scripts (image seeding)
├── data/
│   ├── sql/seed.sql      # Full DB export — restore on fresh VM
│   └── sql/image_manifest.csv  # Maps every image file to its project
├── docker-compose.yml
├── .env.example
└── DOCKER_SETUP.md       # Step-by-step VM onboarding guide
```

---

## License

Union of International Architects (UIA) — All Rights Reserved.
