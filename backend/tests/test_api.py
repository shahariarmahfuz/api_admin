import pytest
import pytest_asyncio
import httpx
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.core.config import settings


@pytest.mark.asyncio
async def test_root_health():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["status"] == "online"


@pytest.mark.asyncio
async def test_utility_health_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/v1/utility/health")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["status"] == "healthy"
        assert "message" in data


@pytest.mark.asyncio
async def test_utility_ip():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/v1/utility/ip")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "ip" in data["data"]


@pytest.mark.asyncio
async def test_auth_login_success_and_failure():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Invalid password
        fail_resp = await client.post(
            "/api/v1/auth/login",
            json={"email": settings.ADMIN_DEFAULT_EMAIL, "password": "WrongPassword!"},
        )
        assert fail_resp.status_code == 401
        fail_data = fail_resp.json()
        assert fail_data["success"] is False
        assert "error" in fail_data
        assert fail_data["error"]["code"] == "INVALID_CREDENTIALS"

        # Valid credentials
        success_resp = await client.post(
            "/api/v1/auth/login",
            json={
                "email": settings.ADMIN_DEFAULT_EMAIL,
                "password": settings.ADMIN_DEFAULT_PASSWORD,
            },
        )
        assert success_resp.status_code == 200
        res = success_resp.json()
        assert res["success"] is True
        assert "access_token" in res["data"]
        assert res["data"]["user"]["role"] == "admin"


@pytest.mark.asyncio
async def test_protected_api_requires_key():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Try hash endpoint without key
        resp = await client.post(
            "/api/v1/utility/hash",
            json={"text": "hello world", "algorithm": "sha256"},
        )
        assert resp.status_code == 401
        data = resp.json()
        assert data["success"] is False
        assert data["error"]["code"] == "API_KEY_REQUIRED"


@pytest.mark.asyncio
async def test_api_key_flow_and_hash():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Login as admin
        login_res = await client.post(
            "/api/v1/auth/login",
            json={
                "email": settings.ADMIN_DEFAULT_EMAIL,
                "password": settings.ADMIN_DEFAULT_PASSWORD,
            },
        )
        token = login_res.json()["data"]["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Create test API key
        key_res = await client.post(
            "/api/v1/api_keys",
            json={"name": "Test Key Pytest", "rate_limit_per_minute": 100},
            headers=headers,
        )
        assert key_res.status_code == 200
        secret_key = key_res.json()["data"]["secret_key"]
        key_id = key_res.json()["data"]["id"]

        # 3. Call hash endpoint with the new API key
        hash_res = await client.post(
            "/api/v1/utility/hash",
            json={"text": "hello world", "algorithm": "sha256"},
            headers={"Authorization": f"Bearer {secret_key}"},
        )
        assert hash_res.status_code == 200
        hash_data = hash_res.json()
        assert hash_data["success"] is True
        # b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9 is sha256 of "hello world"
        assert hash_data["data"]["digest"] == "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9"

        # 4. Revoke key
        del_res = await client.delete(f"/api/v1/api_keys/{key_id}", headers=headers)
        assert del_res.status_code == 200


@pytest.mark.asyncio
async def test_qrcode_generator():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Login
        login_res = await client.post(
            "/api/v1/auth/login",
            json={"email": settings.ADMIN_DEFAULT_EMAIL, "password": settings.ADMIN_DEFAULT_PASSWORD},
        )
        token = login_res.json()["data"]["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Create key
        key_res = await client.post(
            "/api/v1/api_keys",
            json={"name": "QR Test Key", "rate_limit_per_minute": 60},
            headers=headers,
        )
        secret_key = key_res.json()["data"]["secret_key"]
        key_id = key_res.json()["data"]["id"]

        # Generate QR
        qr_res = await client.post(
            "/api/v1/utility/qrcode",
            json={"text": "https://orvia.dev", "format": "base64"},
            headers={"Authorization": f"Bearer {secret_key}"},
        )
        assert qr_res.status_code == 200
        data = qr_res.json()
        assert data["success"] is True
        assert data["data"]["data_url"].startswith("data:image/png;base64,")

        # Clean up key
        await client.delete(f"/api/v1/api_keys/{key_id}", headers=headers)
