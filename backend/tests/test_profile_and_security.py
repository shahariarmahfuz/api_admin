import uuid
import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.core.config import settings


@pytest.mark.asyncio
async def test_v1_health_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/api/v1/health")
        assert res.status_code == 200
        data = res.json()
        assert data["success"] is True
        assert data["data"]["status"] == "healthy"


@pytest.mark.asyncio
async def test_profile_and_security_endpoints():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Login as admin to create a test user
        admin_login = await client.post(
            "/api/v1/auth/login",
            json={
                "email": settings.ADMIN_DEFAULT_EMAIL,
                "password": settings.ADMIN_DEFAULT_PASSWORD,
            },
        )
        assert admin_login.status_code == 200
        admin_token = admin_login.json()["data"]["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}

        # 2. Create an isolated test user
        test_email = f"test_sec_{uuid.uuid4().hex[:8]}@example.com"
        test_pass = "InitialSecurePassword123!"
        create_res = await client.post(
            "/api/v1/users",
            headers=admin_headers,
            json={
                "email": test_email,
                "password": test_pass,
                "full_name": "Test User",
                "role": "user",
            },
        )
        assert create_res.status_code == 200
        created_user = create_res.json()["data"]
        test_user_id = created_user["id"]

        # 3. Login as test user
        user_login = await client.post(
            "/api/v1/auth/login",
            json={"email": test_email, "password": test_pass},
        )
        assert user_login.status_code == 200
        user_token = user_login.json()["data"]["access_token"]
        user_headers = {"Authorization": f"Bearer {user_token}"}

        # 4. Get own profile
        me_res = await client.get("/api/v1/users/me", headers=user_headers)
        assert me_res.status_code == 200
        me_data = me_res.json()["data"]
        assert me_data["email"] == test_email

        # 5. Update own profile (name)
        patch_res = await client.patch(
            "/api/v1/users/me",
            headers=user_headers,
            json={"full_name": "Updated Test Name"},
        )
        assert patch_res.status_code == 200
        assert patch_res.json()["data"]["full_name"] == "Updated Test Name"

        # 6. Get security overview
        sec_res = await client.get("/api/v1/users/me/security", headers=user_headers)
        assert sec_res.status_code == 200
        sec_data = sec_res.json()["data"]
        assert sec_data["email"] == test_email
        assert "active_api_keys_count" in sec_data

        # 7. Change password
        new_pass = "UpdatedSuperSecretPassword999!"
        change_res = await client.post(
            "/api/v1/users/me/change-password",
            headers=user_headers,
            json={
                "current_password": test_pass,
                "new_password": new_pass,
            },
        )
        assert change_res.status_code == 200
        assert change_res.json()["success"] is True

        # 8. Re-authenticate with new password
        relogin = await client.post(
            "/api/v1/auth/login",
            json={"email": test_email, "password": new_pass},
        )
        assert relogin.status_code == 200

        # 9. Clean up test user
        del_res = await client.delete(f"/api/v1/users/{test_user_id}", headers=admin_headers)
        assert del_res.status_code == 200
