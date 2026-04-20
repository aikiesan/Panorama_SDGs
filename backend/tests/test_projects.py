"""Tests for project submission and retrieval endpoints."""
import pytest
from unittest.mock import AsyncMock, patch, MagicMock


SUBMIT_URL = "/api/projects/submit"

VALID_PROJECT = {
    "project_name": "Test SDG Project",
    "organization_name": "Test Org",
    "contact_person": "Jane Doe",
    "contact_email": "jane@test.com",
    "project_status": "in_progress",
    "uia_region": "SECTION_I",
    "city": "Paris",
    "country": "France",
    "latitude": 48.8566,
    "longitude": 2.3522,
    "brief_description": "A brief description of the project.",
    "detailed_description": "A detailed description of the project that explains goals.",
    "success_factors": "Strong community engagement.",
    "typologies": ["Urban mobility"],
    "funding_requirements": ["EU Funds"],
    "government_requirements": ["Local permit"],
    "other_requirements": [],
    "sdgs": [11, 13],
    "image_urls": [],
    "gdpr_consent": True,
    "captcha_token": "test-captcha-token",
}


def _mock_recaptcha_success():
    """Context manager that mocks a successful reCAPTCHA verification."""
    mock_response = MagicMock()
    mock_response.json.return_value = {"success": True}

    mock_client = AsyncMock()
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=None)
    mock_client.post = AsyncMock(return_value=mock_response)

    return patch("app.api.projects.httpx.AsyncClient", return_value=mock_client)


def _mock_email():
    return patch("app.api.projects.send_submission_notification", new=AsyncMock())


def test_submit_project_missing_captcha(client):
    """Submission without captcha_token should fail with 422."""
    data = {k: v for k, v in VALID_PROJECT.items() if k != "captcha_token"}
    resp = client.post(SUBMIT_URL, json=data)
    assert resp.status_code == 422


def test_submit_project_invalid_captcha(client):
    """Submission with failed reCAPTCHA should return 400."""
    mock_response = MagicMock()
    mock_response.json.return_value = {"success": False}

    mock_client = AsyncMock()
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=None)
    mock_client.post = AsyncMock(return_value=mock_response)

    with patch("app.api.projects.settings") as mock_settings:
        mock_settings.ENABLE_RECAPTCHA = True
        mock_settings.RECAPTCHA_SECRET_KEY = "test-secret"
        mock_settings.ADMIN_EMAIL = "admin@test.com"
        mock_settings.FRONTEND_URL = "http://localhost:5173"
        with patch("app.api.projects.httpx.AsyncClient", return_value=mock_client):
            with _mock_email():
                resp = client.post(SUBMIT_URL, json=VALID_PROJECT)
    assert resp.status_code == 400
    assert "reCAPTCHA" in resp.json()["detail"]


def test_submit_project_success(client):
    """Valid submission with successful reCAPTCHA creates project in SUBMITTED state."""
    with _mock_recaptcha_success():
        with _mock_email():
            resp = client.post(SUBMIT_URL, json=VALID_PROJECT)
    assert resp.status_code == 201
    data = resp.json()
    assert data["project_name"] == VALID_PROJECT["project_name"]
    assert data["workflow_status"] == "submitted"
    assert data["city"] == "Paris"


def test_submit_project_invalid_sdg(client):
    """SDG number out of 1-17 range should fail with 422."""
    bad_data = {**VALID_PROJECT, "sdgs": [0, 18]}
    with _mock_recaptcha_success():
        with _mock_email():
            resp = client.post(SUBMIT_URL, json=bad_data)
    assert resp.status_code == 422


def test_submit_project_no_gdpr_consent(client):
    """Missing GDPR consent should fail with 422."""
    bad_data = {**VALID_PROJECT, "gdpr_consent": False}
    with _mock_recaptcha_success():
        with _mock_email():
            resp = client.post(SUBMIT_URL, json=bad_data)
    assert resp.status_code == 422


def test_get_approved_project_by_id(client):
    """Approved project can be retrieved by ID."""
    from app.models.project import WorkflowStatus

    # Submit first
    with _mock_recaptcha_success():
        with _mock_email():
            submit_resp = client.post(SUBMIT_URL, json=VALID_PROJECT)
    project_id = submit_resp.json()["id"]

    # Directly approve it via the DB (bypass workflow)
    from app.core.database import get_db
    # Use admin endpoint instead - register admin and approve
    client.post("/api/auth/register", json={
        "email": "admin@test.com",
        "password": "pass123",
        "role": "admin"
    })
    login = client.post("/api/auth/login", json={"email": "admin@test.com", "password": "pass123"})
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    with patch("app.api.admin.send_approval_email", new=AsyncMock()):
        approve_resp = client.post(f"/api/admin/projects/{project_id}/approve", headers=headers)
    assert approve_resp.status_code == 200

    resp = client.get(f"/api/projects/{project_id}")
    assert resp.status_code == 200
    assert resp.json()["project_name"] == VALID_PROJECT["project_name"]


def test_get_unapproved_project_returns_404(client):
    """Unapproved (submitted) project should return 404 for public."""
    with _mock_recaptcha_success():
        with _mock_email():
            submit_resp = client.post(SUBMIT_URL, json=VALID_PROJECT)
    project_id = submit_resp.json()["id"]
    resp = client.get(f"/api/projects/{project_id}")
    assert resp.status_code == 404
