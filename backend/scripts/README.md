# Database Scripts

This folder contains utility scripts for database maintenance and migrations.

## update_image_urls.py

Updates all project image URLs in the database to use the correct path format (`/project_images/filename.jpg`).

### Usage

Make sure you have a `.env` file configured in the `backend/` directory with your DATABASE_URL.

```bash
# From the backend directory
cd backend

# Activate your virtual environment if needed
# Windows:
.\venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Run the script
python scripts/update_image_urls.py
```

### What it does

1. Connects to your database
2. Retrieves all ProjectImage records
3. Extracts the filename from each image URL
4. Updates the URL to `/project_images/{filename}`
5. Commits the changes
6. Shows a summary of updated records

This ensures all images stored in `frontend/public/project_images/` are properly referenced in the application.
