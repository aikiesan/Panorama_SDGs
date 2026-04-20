"""Extended tests for submission round-trip, image upload, edit-token flow, and edge cases."""
import io
import uuid
import pytest
from unittest.mock import AsyncMock, patch, MagicMock

SUBMIT_URL = "/api/projects/submit"
UPLOAD_URL = "/api/projects/upload"

FULL_PROJECT = {
    "project_name": "Full Round-Trip Project",
    "organization_name": "Test Org",
    "contact_person": "Jane Doe",
    "contact_email": "jane@test.com",
    "project_status": "in_progress",
    "uia_region": "SECTION_I",
    "city": "Berlin",
    "country": "Germany",
    "latitude": 52.5200,
    "longitude": 13.4050,
    "brief_description": "A brief description here.",
    "detailed_description": "A detailed description of the project goals.",
    "success_factors": "Community engagement and political will.",
    "typologies": ["Affordable Housing", "Others"],
    "funding_requirements": ["Grant", "Others"],
    "government_requirements": ["Policy Support", "Others"],
    "other_requirements": ["Technical Expertise"],
    "other_requirement_text": "We need structural engineers.",
    "other_typology_text": "Mixed-use regeneration zone",
    "other_funding_text": "In-kind material support",
    "other_gov_text": "Fast-track planning approval",
    "sdgs": [11, 13],
    "image_urls": ["https://example.com/img1.jpg"],
    "gdpr_consent": True,
    "captcha_token": "test-captcha-token",
}


def _mock_recaptcha_success():
    mock_response = MagicMock()
    mock_response.json.return_value = {"success": True}
    mock_client = AsyncMock()
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=None)
    mock_client.post = AsyncMock(return_value=mock_response)
    return patch("app.api.projects.httpx.AsyncClient", return_value=mock_client)


def _mock_email():
    return patch("app.api.projects.send_submission_notification", new=AsyncMock())


def _submit_full_project(client):
    """Helper: submit FULL_PROJECT and return the response JSON."""
    with _mock_recaptcha_success(), _mock_email():
        resp = client.post(SUBMIT_URL, json=FULL_PROJECT)
    assert resp.status_code == 201, resp.text
    return resp.json()


# ---------------------------------------------------------------------------
# 2a. Round-trip persistence
# ---------------------------------------------------------------------------

def test_full_round_trip_persistence(client, auth_headers):
    """All nested data (SDGs, typologies, requirements, images, other-text) survives DB round-trip."""
    project = _submit_full_project(client)
    project_id = project["id"]

    # Approve so it's publicly accessible
    with patch("app.api.admin.send_approval_email", new=AsyncMock()):
        approve = client.post(f"/api/admin/projects/{project_id}/approve", headers=auth_headers)
    assert approve.status_code == 200

    resp = client.get(f"/api/projects/{project_id}")
    assert resp.status_code == 200
    data = resp.json()

    # Scalar fields
    assert data["city"] == "Berlin"
    assert data["other_requirement_text"] == "We need structural engineers."
    assert data["other_typology_text"] == "Mixed-use regeneration zone"
    assert data["other_funding_text"] == "In-kind material support"
    assert data["other_gov_text"] == "Fast-track planning approval"

    # Nested lists
    assert set(data["sdgs"]) == {11, 13}
    assert "Affordable Housing" in data["typologies"]
    assert "Others" in data["typologies"]
    assert "Grant" in data["funding_requirements"]
    assert "Others" in data["funding_requirements"]
    assert "Policy Support" in data["government_requirements"]
    assert "Technical Expertise" in data["other_requirements"]
    assert "https://example.com/img1.jpg" in data["image_urls"]


def test_submission_other_text_fields_persist(client):
    """other_typology_text / other_funding_text / other_gov_text are stored on creation."""
    project = _submit_full_project(client)
    assert project["other_typology_text"] == "Mixed-use regeneration zone"
    assert project["other_funding_text"] == "In-kind material support"
    assert project["other_gov_text"] == "Fast-track planning approval"


def test_submission_without_other_text_fields(client):
    """Submission succeeds when other-text fields are absent (all optional)."""
    minimal = {**FULL_PROJECT}
    for key in ("other_typology_text", "other_funding_text", "other_gov_text", "other_requirement_text"):
        minimal.pop(key, None)
    with _mock_recaptcha_success(), _mock_email():
        resp = client.post(SUBMIT_URL, json=minimal)
    assert resp.status_code == 201
    data = resp.json()
    assert data["other_typology_text"] is None
    assert data["other_funding_text"] is None
    assert data["other_gov_text"] is None


# ---------------------------------------------------------------------------
# 2b. Image upload endpoint
# ---------------------------------------------------------------------------

def _make_supabase_mock(public_url="https://cdn.example.com/img.jpg"):
    mock_storage = MagicMock()
    mock_storage.from_.return_value.upload.return_value = MagicMock()
    mock_storage.from_.return_value.get_public_url.return_value = public_url
    mock_client = MagicMock()
    mock_client.storage = mock_storage
    return patch("app.api.projects.get_supabase_client", return_value=mock_client)


def test_upload_valid_jpeg(client):
    """Valid JPEG upload returns a public URL."""
    fake_file = io.BytesIO(b"\xff\xd8\xff" + b"0" * 100)  # JPEG magic bytes
    with _make_supabase_mock():
        resp = client.post(
            UPLOAD_URL,
            files={"file": ("photo.jpg", fake_file, "image/jpeg")},
        )
    assert resp.status_code == 200
    assert "url" in resp.json()


def test_upload_rejects_pdf(client):
    """PDF uploads must be rejected with 400."""
    fake_file = io.BytesIO(b"%PDF-1.4 fake content")
    resp = client.post(
        UPLOAD_URL,
        files={"file": ("doc.pdf", fake_file, "application/pdf")},
    )
    assert resp.status_code == 400
    assert "invalid file type" in resp.json()["detail"].lower()


def test_upload_rejects_oversized_file(client):
    """Files over 5 MB must be rejected with 400."""
    big_file = io.BytesIO(b"x" * (6 * 1024 * 1024))
    resp = client.post(
        UPLOAD_URL,
        files={"file": ("big.jpg", big_file, "image/jpeg")},
    )
    assert resp.status_code == 400
    assert "5mb" in resp.json()["detail"].lower()


def test_upload_no_file_returns_422(client):
    """Posting to upload without a file returns 422."""
    resp = client.post(UPLOAD_URL)
    assert resp.status_code == 422


# ---------------------------------------------------------------------------
# 2c. Edit-token flow
# ---------------------------------------------------------------------------

def test_changes_requested_generates_edit_token(client, auth_headers):
    """Admin request-changes sets an edit_token on the project."""
    project = _submit_full_project(client)
    project_id = project["id"]

    with patch("app.api.admin.send_changes_requested_email", new=AsyncMock()):
        resp = client.post(
            f"/api/admin/projects/{project_id}/request-changes",
            headers=auth_headers,
            json={"message": "Please add more detail."},
        )
    assert resp.status_code == 200

    # Verify token was set via direct DB query
    from app.models.project import Project as ProjectModel
    from app.core.database import get_db
    db = next(client.app.dependency_overrides[get_db]())
    proj = db.query(ProjectModel).filter(ProjectModel.id == uuid.UUID(project_id)).first()
    assert proj is not None
    assert proj.edit_token is not None


def test_edit_via_valid_token(client):
    """PUT /api/projects/edit/{token} updates the project successfully."""
    project = _submit_full_project(client)
    project_id = project["id"]

    with patch("app.api.admin.send_changes_requested_email", new=AsyncMock()):
        client.post(
            f"/api/admin/projects/{project_id}/request-changes",
            headers=_get_auth_headers(client),
            json={"message": "Update needed."},
        )

    # Retrieve the edit token from DB
    from app.models.project import Project as ProjectModel
    from app.core.database import get_db
    db = next(client.app.dependency_overrides[get_db]())
    proj = db.query(ProjectModel).filter(ProjectModel.id == uuid.UUID(project_id)).first()
    token = proj.edit_token

    updated = {**FULL_PROJECT, "project_name": "Updated Project Name"}
    with patch("app.api.projects.send_submission_notification", new=AsyncMock()):
        resp = client.put(f"/api/projects/edit/{token}", json=updated)
    assert resp.status_code == 200
    assert resp.json()["project_name"] == "Updated Project Name"


def test_edit_via_invalid_token_returns_404(client):
    """PUT with a nonexistent token must return 404."""
    resp = client.put("/api/projects/edit/nonexistent-token-xyz", json=FULL_PROJECT)
    assert resp.status_code == 404


def test_get_by_valid_token(client):
    """GET /api/projects/edit/{token} returns the project for the token holder."""
    project = _submit_full_project(client)
    project_id = project["id"]

    with patch("app.api.admin.send_changes_requested_email", new=AsyncMock()):
        client.post(
            f"/api/admin/projects/{project_id}/request-changes",
            headers=_get_auth_headers(client),
            json={"message": "Please revise."},
        )

    from app.models.project import Project as ProjectModel
    from app.core.database import get_db
    db = next(client.app.dependency_overrides[get_db]())
    proj = db.query(ProjectModel).filter(ProjectModel.id == uuid.UUID(project_id)).first()
    token = proj.edit_token

    resp = client.get(f"/api/projects/edit/{token}")
    assert resp.status_code == 200
    assert resp.json()["id"] == project_id


# ---------------------------------------------------------------------------
# 2d. reCAPTCHA 503
# ---------------------------------------------------------------------------

def test_recaptcha_service_unreachable_returns_503(client):
    """httpx.RequestError during reCAPTCHA check returns 503."""
    import httpx
    mock_client = AsyncMock()
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=None)
    mock_client.post = AsyncMock(side_effect=httpx.RequestError("timeout"))

    with patch("app.api.projects.settings") as mock_settings:
        mock_settings.ENABLE_RECAPTCHA = True
        mock_settings.RECAPTCHA_SECRET_KEY = "test-secret"
        mock_settings.ADMIN_EMAIL = "admin@test.com"
        mock_settings.FRONTEND_URL = "http://localhost:5173"
        with patch("app.api.projects.httpx.AsyncClient", return_value=mock_client):
            with _mock_email():
                resp = client.post(SUBMIT_URL, json=FULL_PROJECT)
    assert resp.status_code == 503


# ---------------------------------------------------------------------------
# 2e. Email failure is non-blocking
# ---------------------------------------------------------------------------

def test_email_failure_does_not_block_submission(client):
    """If send_submission_notification raises, submission still returns 201."""
    async def boom(*args, **kwargs):
        raise Exception("SMTP server down")

    with _mock_recaptcha_success():
        with patch("app.api.projects.send_submission_notification", new=boom):
            resp = client.post(SUBMIT_URL, json=FULL_PROJECT)
    assert resp.status_code == 201


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_auth_headers(client):
    """Register/login an admin and return auth headers (idempotent within a test)."""
    client.post("/api/auth/register", json={
        "email": "admin@test.com",
        "password": "testpass123",
        "role": "admin",
    })
    resp = client.post("/api/auth/login", json={
        "email": "admin@test.com",
        "password": "testpass123",
    })
    token = resp.json().get("access_token")
    return {"Authorization": f"Bearer {token}"}
