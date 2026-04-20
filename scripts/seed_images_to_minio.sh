#!/usr/bin/env bash
# Upload project images from a local folder into MinIO.
# Run once after `docker compose up -d` on a new VM that has the image archive.
#
# Usage:
#   bash scripts/seed_images_to_minio.sh [path/to/project_images]
#
# Default source: ./frontend/public/project_images/
# Images land in MinIO bucket "project-images" with public read access.

set -euo pipefail

IMAGE_DIR="${1:-./frontend/public/project_images}"
MINIO_ALIAS="local"
BUCKET="project-images"
NETWORK="atlas_33_default"

if [ ! -d "$IMAGE_DIR" ]; then
  echo "ERROR: Image directory not found: $IMAGE_DIR"
  echo "Download the image archive and extract it there first."
  exit 1
fi

echo "Uploading images from $IMAGE_DIR to MinIO bucket '$BUCKET'..."

# Use the MinIO Client (mc) via Docker to avoid installing it locally
MC="docker run --rm --network $NETWORK minio/mc"

$MC alias set $MINIO_ALIAS http://minio:9000 \
  "${MINIO_ROOT_USER:-atlas_minio}" \
  "${MINIO_ROOT_PASSWORD:-atlas_minio_pass}"

$MC mb --ignore-existing "$MINIO_ALIAS/$BUCKET"
$MC anonymous set public "$MINIO_ALIAS/$BUCKET"

# Copy all images recursively
docker run --rm \
  --network "$NETWORK" \
  -v "$(realpath "$IMAGE_DIR"):/images:ro" \
  minio/mc \
  cp --recursive /images/ "$MINIO_ALIAS/$BUCKET/"

echo ""
echo "Done. Images available at http://localhost:9000/$BUCKET/"
