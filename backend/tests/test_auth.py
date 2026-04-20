"""Tests for authentication endpoints."""
import pytest


REGISTER_URL = "/api/auth/register"
LOGIN_URL = "/api/auth/login"
ME_URL = "/api/auth/me"

USER_DATA = {
    "email": "user@test.com",
    "password": "securepass123",
    "role": "reviewer"
}


def test_register_new_user(client):
    resp = client.post(REGISTER_URL, json=USER_DATA)
    assert resp.status_code == 201
    data = resp.json()
    assert data["email"] == USER_DATA["email"]
    assert data["role"] == "reviewer"
    assert "id" in data
    assert "hashed_password" not in data


def test_register_duplicate_email(client):
    client.post(REGISTER_URL, json=USER_DATA)
    resp = client.post(REGISTER_URL, json=USER_DATA)
    assert resp.status_code == 400
    assert "already registered" in resp.json()["detail"]


def test_login_success(client):
    client.post(REGISTER_URL, json=USER_DATA)
    resp = client.post(LOGIN_URL, json={
        "email": USER_DATA["email"],
        "password": USER_DATA["password"]
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == USER_DATA["email"]


def test_login_wrong_password(client):
    client.post(REGISTER_URL, json=USER_DATA)
    resp = client.post(LOGIN_URL, json={
        "email": USER_DATA["email"],
        "password": "wrongpassword"
    })
    assert resp.status_code == 401
    assert "Incorrect" in resp.json()["detail"]


def test_login_unknown_email(client):
    resp = client.post(LOGIN_URL, json={
        "email": "ghost@test.com",
        "password": "somepass"
    })
    assert resp.status_code == 401


def test_me_endpoint_authenticated(client):
    client.post(REGISTER_URL, json=USER_DATA)
    login_resp = client.post(LOGIN_URL, json={
        "email": USER_DATA["email"],
        "password": USER_DATA["password"]
    })
    token = login_resp.json()["access_token"]
    resp = client.get(ME_URL, headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["email"] == USER_DATA["email"]


def test_me_endpoint_unauthenticated(client):
    resp = client.get(ME_URL)
    assert resp.status_code == 403


def test_me_endpoint_invalid_token(client):
    resp = client.get(ME_URL, headers={"Authorization": "Bearer invalid.token.here"})
    assert resp.status_code == 401
