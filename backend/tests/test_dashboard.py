"""Tests for dashboard KPI, filter, and map-marker endpoints."""
import pytest
from unittest.mock import AsyncMock, patch, MagicMock


SUBMIT_URL = "/api/projects/submit"


def _mock_recaptcha_success():
    mock_response = MagicMock()
    mock_response.json.return_value = {"success": True}
    mock_client = AsyncMock()
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=None)
    mock_client.post = AsyncMock(return_value=mock_response)
    return patch("app.api.projects.httpx.AsyncClient", return_value=mock_client)


def _submit_and_approve(client, auth_headers, city="Berlin", country="Germany", sdgs=None):
    """Helper: submit a project and approve it, return project ID."""
    project = {
        "project_name": f"Project in {city}",
        "organization_name": "Test Org",
        "contact_person": "Tester",
        "contact_email": f"tester_{city.lower()}@test.com",
        "project_status": "in_progress",
        "uia_region": "SECTION_I",
        "city": city,
        "country": country,
        "latitude": 52.52,
        "longitude": 13.405,
        "brief_description": "Brief.",
        "detailed_description": "Detailed.",
        "success_factors": "Factors.",
        "typologies": ["Climate"],
        "funding_requirements": ["EU"],
        "government_requirements": [],
        "other_requirements": [],
        "sdgs": sdgs or [11],
        "image_urls": [],
        "gdpr_consent": True,
        "captcha_token": "test-token",
    }
    with _mock_recaptcha_success():
        with patch("app.api.projects.send_submission_notification", new=AsyncMock()):
            resp = client.post(SUBMIT_URL, json=project)
    project_id = resp.json()["id"]

    with patch("app.api.admin.send_approval_email", new=AsyncMock()):
        client.post(f"/api/admin/projects/{project_id}/approve", headers=auth_headers)

    return project_id


def test_kpis_empty_db(client):
    resp = client.get("/api/dashboard/kpis")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_projects"] == 0
    assert data["cities_engaged"] == 0


def test_kpis_with_projects(client, auth_headers):
    _submit_and_approve(client, auth_headers, city="Berlin")
    _submit_and_approve(client, auth_headers, city="Paris", country="France")

    resp = client.get("/api/dashboard/kpis")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_projects"] == 2
    assert data["cities_engaged"] == 2
    assert data["countries_represented"] == 2


def test_kpis_filter_by_sdg(client, auth_headers):
    _submit_and_approve(client, auth_headers, city="Rome", country="Italy", sdgs=[13])
    _submit_and_approve(client, auth_headers, city="Madrid", country="Spain", sdgs=[11])

    resp = client.get("/api/dashboard/kpis?sdg=13")
    assert resp.status_code == 200
    assert resp.json()["total_projects"] == 1


def test_kpis_filter_by_city(client, auth_headers):
    _submit_and_approve(client, auth_headers, city="Lisbon", country="Portugal")
    _submit_and_approve(client, auth_headers, city="Prague", country="Czech Republic")

    resp = client.get("/api/dashboard/kpis?city=Lisbon")
    assert resp.status_code == 200
    assert resp.json()["total_projects"] == 1


def test_map_markers_empty(client):
    resp = client.get("/api/dashboard/map-markers")
    assert resp.status_code == 200
    assert resp.json() == []


def test_map_markers_with_approved_project(client, auth_headers):
    _submit_and_approve(client, auth_headers, city="Vienna", country="Austria")

    resp = client.get("/api/dashboard/map-markers")
    assert resp.status_code == 200
    markers = resp.json()
    assert len(markers) >= 1
    marker = markers[0]
    assert "latitude" in marker
    assert "longitude" in marker
    assert "project_name" in marker
    assert "primary_sdg" in marker


def test_filters_endpoint(client, auth_headers):
    _submit_and_approve(client, auth_headers, city="Athens", country="Greece")

    resp = client.get("/api/dashboard/filters")
    assert resp.status_code == 200
    data = resp.json()
    assert "cities" in data
    assert "Athens" in data["cities"]


def test_dashboard_projects_pagination(client, auth_headers):
    for i in range(3):
        _submit_and_approve(client, auth_headers, city=f"City{i}", country="TestLand")

    resp = client.get("/api/dashboard/projects?page=1&page_size=2")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 3
    assert len(data["projects"]) == 2
