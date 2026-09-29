import pytest
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.core.config import settings
from app.core.encryption import encrypt_credentials, decrypt_credentials, mask_secret
from app.services.providers.registry import provider_registry


def test_encryption_and_masking():
    data = {
        "cloud_name": "demo_cloud",
        "api_key": "123456789012345",
        "api_secret": "super_secret_token_abc_xyz",
    }
    encrypted = encrypt_credentials(data)
    assert isinstance(encrypted, str)
    assert "super_secret" not in encrypted

    decrypted = decrypt_credentials(encrypted)
    assert decrypted["cloud_name"] == "demo_cloud"
    assert decrypted["api_key"] == "123456789012345"
    assert decrypted["api_secret"] == "super_secret_token_abc_xyz"

    masked_sec = mask_secret(data["api_secret"])
    assert "••••••••" in masked_sec
    assert masked_sec != data["api_secret"]


def test_provider_registry():
    cloudinary = provider_registry.get("cloudinary")
    assert cloudinary is not None
    assert cloudinary.name == "cloudinary"
    available = provider_registry.list_available()
    names = [p["name"] for p in available]
    assert "cloudinary" in names
    
    cloud_bp = next(p for p in available if p["name"] == "cloudinary")
    fields = [f["key"] for f in cloud_bp["credential_schema"]]
    assert "cloud_name" in fields
    assert "api_key" in fields
    assert "api_secret" in fields
    
    op_ids = [op["id"] for op in cloud_bp["operations"]]
    assert "upload_image" in op_ids


@pytest.mark.asyncio
async def test_admin_providers_available_endpoint():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        # 1. Login as admin
        login_res = await ac.post(
            "/api/v1/auth/login",
            json={
                "email": settings.ADMIN_DEFAULT_EMAIL,
                "password": settings.ADMIN_DEFAULT_PASSWORD,
            },
        )
        assert login_res.status_code == 200
        token = login_res.json()["data"]["access_token"]

        # 2. Access providers endpoint
        res = await ac.get(
            "/api/v1/admin/providers/available",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res.status_code == 200
        payload = res.json()
        assert payload["success"] is True
        blueprints = payload["data"]
        names = [b["provider_name"] for b in blueprints]
        assert "cloudinary" in names
