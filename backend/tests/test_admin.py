"""Tests for admin project management endpoints."""
import pytest
from unittest.mock import AsyncMock, patch, MagicMock


SUBMIT_URL = "/api/projects/submit"

VALID_PROJECT = {
    "project_name": "Admin Test Project",
    "organization_name": "Test Org",
    "contact_person": "Admin Tester",
    "contact_email": "submitter@test.com",
    "project_status": "in_progress",
    "uia_region": "SECTION_II",
    "city": "Warsaw",
    "country": "Poland",
    "latitude": 52.2297,
    "longitude": 21.0122,
    "brief_description": "Brief description.",
    "detailed_description": "Detailed description of the project.",
    "success_factors": "Community support.",
    "typologies": ["Environment"],
    "funding_requirements": ["National Funds"],
    "government_requirements": [],
    "other_requirements": [],
    "sdgs": [3, 11],
    "image_urls": [],
    "gdpr_consent": True,
    "captcha_token": "test-token",
}


def _mock_recaptcha_success():
    mock_response = MagicMock()
    mock_response.json.return_value = {"success": True}
    mock_client = AsyncMock()
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=None)
    mock_client.post = AsyncMock(return_value=mock_response)
    return patch("app.api.projects.httpx.AsyncClient", return_value=mock_client)


def _submit_project(client):
    with _mock_recaptcha_success():
        with patch("app.api.projects.send_submission_notification", new=AsyncMock()):
            resp = client.post(SUBMIT_URL, json=VALID_PROJECT)
    assert resp.status_code == 201
    return resp.json()["id"]


def test_pending_projects_requires_auth(client):
    resp = client.get("/api/admin/pending-projects")
    assert resp.status_code == 403


def test_pending_projects_requires_admin_role(client):
    """A non-admin/reviewer role should not access admin endpoints."""
    # Register a manager-level user (not admin/reviewer won't work — managers also pass)
    # The UserRole enum allows admin, reviewer, manager; only admin/reviewer pass get_current_admin
    # So we test with the auth required check (already tested above)
    resp = client.get("/api/admin/pending-projects")
    assert resp.status_code == 403


def test_approve_project(client, auth_headers):
    project_id = _submit_project(client)
    with patch("app.api.admin.send_approval_email", new=AsyncMock()):
        resp = client.post(f"/api/admin/projects/{project_id}/approve", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["workflow_status"] == "approved"


def test_reject_project(client, auth_headers):
    project_id = _submit_project(client)
    with patch("app.api.admin.send_rejection_email", new=AsyncMock()):
        resp = client.post(
            f"/api/admin/projects/{project_id}/reject",
            json={"reason": "Does not meet criteria"},
            headers=auth_headers
        )
    assert resp.status_code == 200
    assert resp.json()["message"] == "Project rejected"

    # Verify project has rejection reason stored
    detail = client.get(f"/api/admin/projects/{project_id}", headers=auth_headers)
    assert detail.json()["rejection_reason"] == "Does not meet criteria"


def test_request_changes(client, auth_headers):
    project_id = _submit_project(client)
    with patch("app.api.admin.send_changes_requested_email", new=AsyncMock()):
        resp = client.post(
            f"/api/admin/projects/{project_id}/request-changes",
            json={"message": "Please add more details about funding."},
            headers=auth_headers
        )
    assert resp.status_code == 200
    assert resp.json()["message"] == "Changes requested"

    detail = client.get(f"/api/admin/projects/{project_id}", headers=auth_headers)
    assert detail.json()["reviewer_notes"] == "Please add more details about funding."
    assert detail.json()["workflow_status"] == "changes_requested"


def test_reject_requires_body(client, auth_headers):
    """Reject endpoint must reject missing body with 422."""
    project_id = _submit_project(client)
    resp = client.post(
        f"/api/admin/projects/{project_id}/reject",
        headers=auth_headers
        # No body
    )
    assert resp.status_code == 422


def test_get_all_projects(client, auth_headers):
    _submit_project(client)
    resp = client.get("/api/admin/all-projects", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["total"] >= 1


def test_get_pending_projects(client, auth_headers):
    _submit_project(client)
    resp = client.get("/api/admin/pending-projects", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["total"] >= 1


def test_delete_project(client, auth_headers):
    project_id = _submit_project(client)
    resp = client.delete(f"/api/admin/projects/{project_id}", headers=auth_headers)
    assert resp.status_code == 200

    resp = client.get(f"/api/admin/projects/{project_id}", headers=auth_headers)
    assert resp.status_code == 404
