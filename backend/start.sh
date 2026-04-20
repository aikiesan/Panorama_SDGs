#!/bin/bash

# Exit on error
set -e

# Run migrations (skip if SKIP_MIGRATIONS=true)
if [ "$SKIP_MIGRATIONS" != "true" ]; then
  echo "Running migrations..."
  alembic upgrade head || echo "Migration failed, continuing anyway..."
fi

# Import initial data (skip if SKIP_DATA_IMPORT=true)
# The script checks for duplicates by name, so it is safe to run repeatedly.
if [ "$SKIP_DATA_IMPORT" != "true" ]; then
  echo "Running initial data import..."
  python import_full_dataset.py || echo "Data import failed, continuing anyway..."
else
  echo "Skipping data import (SKIP_DATA_IMPORT=true)"
fi

# Start the application
exec gunicorn -c gunicorn_conf.py app.main:app
