import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.logging import logger
from app.core.security import hash_password, generate_api_key
from app.models.user import User
from app.models.api_key import ApiKey
from app.models.api_service import ApiService


INITIAL_SERVICES = [
    {
        "name": "System Health",
        "slug": "utility-health",
        "description": "Returns operational health status, database latency, and platform uptime.",
        "category": "utility",
        "endpoint": "/api/v1/utility/health",
        "method": "GET",
        "version": "v1",
        "status": "ACTIVE",
        "requires_auth": False,
        "rate_limit_per_minute": 120,
        "documentation": {
            "summary": "Check health of the API platform and database connection",
            "parameters": [],
            "headers": [],
            "responses": {
                "200": {
                    "description": "Platform is fully operational",
                    "example": {
                        "success": True,
                        "data": {
                            "status": "healthy",
                            "version": "1.0.0",
                            "database": "connected",
                            "timestamp": "2026-09-29T07:00:00Z"
                        },
                        "message": "Platform healthy"
                    }
                }
            }
        }
    },
    {
        "name": "QR Code Generator",
        "slug": "utility-qrcode",
        "description": "High-performance vector and raster QR code generation with custom sizes, colors, and error correction.",
        "category": "utility",
        "endpoint": "/api/v1/utility/qrcode",
        "method": "POST",
        "version": "v1",
        "status": "ACTIVE",
        "requires_auth": True,
        "rate_limit_per_minute": 60,
        "documentation": {
            "summary": "Generate QR code in base64 data URL or raw PNG",
            "parameters": [
                {"name": "text", "type": "string", "required": True, "description": "Text, URL or payload to encode"},
                {"name": "size", "type": "integer", "required": False, "default": 10, "description": "Box size (1-30)"},
                {"name": "border", "type": "integer", "required": False, "default": 2, "description": "Border width"},
                {"name": "format", "type": "string", "required": False, "default": "base64", "description": "Output format: base64 or raw"}
            ],
            "headers": [
                {"name": "Authorization", "type": "string", "required": True, "description": "Bearer <API_KEY>"}
            ],
            "responses": {
                "200": {
                    "description": "QR Code generated successfully",
                    "example": {
                        "success": True,
                        "data": {
                            "data_url": "data:image/png;base64,iVBORw0KGgo...",
                            "format": "png",
                            "payload_length": 24
                        },
                        "message": "QR code generated successfully"
                    }
                }
            }
        }
    },
    {
        "name": "Client IP & Geo Insight",
        "slug": "utility-ip",
        "description": "Extracts client IP address, proxy headers, user-agent details, and protocol metadata.",
        "category": "utility",
        "endpoint": "/api/v1/utility/ip",
        "method": "GET",
        "version": "v1",
        "status": "ACTIVE",
        "requires_auth": False,
        "rate_limit_per_minute": 100,
        "documentation": {
            "summary": "Retrieve client IP, protocol, and incoming request headers",
            "parameters": [],
            "headers": [],
            "responses": {
                "200": {
                    "description": "Client network inspection",
                    "example": {
                        "success": True,
                        "data": {
                            "ip": "203.0.113.195",
                            "protocol": "HTTP/1.1",
                            "user_agent": "curl/7.81.0"
                        },
                        "message": "IP info retrieved successfully"
                    }
                }
            }
        }
    },
    {
        "name": "Cryptographic Hash Generator",
        "slug": "utility-hash",
        "description": "Computes SHA-256, SHA-512, MD5, and SHA-1 digests for strings and binary payloads.",
        "category": "utility",
        "endpoint": "/api/v1/utility/hash",
        "method": "POST",
        "version": "v1",
        "status": "ACTIVE",
        "requires_auth": True,
        "rate_limit_per_minute": 120,
        "documentation": {
            "summary": "Hash text using specified algorithm",
            "parameters": [
                {"name": "text", "type": "string", "required": True, "description": "Input text to hash"},
                {"name": "algorithm", "type": "string", "required": False, "default": "sha256", "description": "sha256, sha512, md5, sha1"}
            ],
            "headers": [
                {"name": "Authorization", "type": "string", "required": True, "description": "Bearer <API_KEY>"}
            ],
            "responses": {
                "200": {
                    "description": "Hash computed",
                    "example": {
                        "success": True,
                        "data": {
                            "algorithm": "sha256",
                            "digest": "2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae",
                            "input_length": 3
                        },
                        "message": "Hash generated successfully"
                    }
                }
            }
        }
    },
    {
        "name": "Image Metadata Inspector",
        "slug": "image-info",
        "description": "Streams and extracts dimensions, color space, EXIF orientation, and MIME format without loading entire files into memory.",
        "category": "image",
        "endpoint": "/api/v1/image/info",
        "method": "POST",
        "version": "v1",
        "status": "ACTIVE",
        "requires_auth": True,
        "rate_limit_per_minute": 60,
        "documentation": {
            "summary": "Inspect image dimensions and format from multipart file upload",
            "parameters": [
                {"name": "file", "type": "file", "required": True, "description": "Image file (JPEG, PNG, WebP)"}
            ],
            "headers": [
                {"name": "Authorization", "type": "string", "required": True, "description": "Bearer <API_KEY>"}
            ],
            "responses": {
                "200": {
                    "description": "Image metadata",
                    "example": {
                        "success": True,
                        "data": {
                            "width": 1920,
                            "height": 1080,
                            "format": "PNG",
                            "mode": "RGBA",
                            "size_bytes": 216091
                        },
                        "message": "Image metadata inspected"
                    }
                }
            }
        }
    },
    {
        "name": "Image Resizer & Optimizer",
        "slug": "image-resize",
        "description": "Stream-resized images with aspect ratio preservation, WebP conversion, and memory-safe buffer chunks.",
        "category": "image",
        "endpoint": "/api/v1/image/resize",
        "method": "POST",
        "version": "v1",
        "status": "ACTIVE",
        "requires_auth": True,
        "rate_limit_per_minute": 40,
        "documentation": {
            "summary": "Resize uploaded image with streaming delivery",
            "parameters": [
                {"name": "file", "type": "file", "required": True, "description": "Image to resize"},
                {"name": "width", "type": "integer", "required": False, "description": "Target width"},
                {"name": "height", "type": "integer", "required": False, "description": "Target height"},
                {"name": "format", "type": "string", "required": False, "default": "webp", "description": "Output format: webp, png, jpeg"}
            ],
            "headers": [
                {"name": "Authorization", "type": "string", "required": True, "description": "Bearer <API_KEY>"}
            ],
            "responses": {
                "200": {"description": "Optimized image binary stream with Content-Type header"}
            }
        }
    },
    {
        "name": "Media Metadata Extractor",
        "slug": "media-info",
        "description": "Inspects external media URLs, mime-types, content lengths, and caching headers using pooled non-blocking HTTP clients.",
        "category": "media",
        "endpoint": "/api/v1/media/info",
        "method": "POST",
        "version": "v1",
        "status": "BETA",
        "requires_auth": True,
        "rate_limit_per_minute": 60,
        "documentation": {
            "summary": "Probe remote media headers safely without downloading full body",
            "parameters": [
                {"name": "url", "type": "string", "required": True, "description": "Target media URL"}
            ],
            "headers": [
                {"name": "Authorization", "type": "string", "required": True, "description": "Bearer <API_KEY>"}
            ],
            "responses": {
                "200": {
                    "description": "Remote media headers",
                    "example": {
                        "success": True,
                        "data": {
                            "content_type": "image/png",
                            "content_length_bytes": 216091,
                            "etag": "\"123456\"",
                            "accessible": True
                        },
                        "message": "Media inspected successfully"
                    }
                }
            }
        }
    },
    {
        "name": "Social OpenGraph Scraper",
        "slug": "social-preview",
        "description": "Scrapes OpenGraph, Twitter Card, and meta tags from any public URL to build rich preview snippets.",
        "category": "social",
        "endpoint": "/api/v1/social/preview",
        "method": "POST",
        "version": "v1",
        "status": "ACTIVE",
        "requires_auth": True,
        "rate_limit_per_minute": 50,
        "documentation": {
            "summary": "Extract OpenGraph titles, descriptions, and thumbnails",
            "parameters": [
                {"name": "url", "type": "string", "required": True, "description": "Webpage URL to scrape"}
            ],
            "headers": [
                {"name": "Authorization", "type": "string", "required": True, "description": "Bearer <API_KEY>"}
            ],
            "responses": {
                "200": {
                    "description": "Social card metadata",
                    "example": {
                        "success": True,
                        "data": {
                            "title": "Orvia API Platform",
                            "description": "Modern API management and execution engine",
                            "image": "https://orvia.dev/preview.png",
                            "site_name": "Orvia"
                        },
                        "message": "Social preview extracted successfully"
                    }
                }
            }
        }
    }
]


async def bootstrap_initial_data(db: AsyncSession) -> dict:
    """
    Initializes admin user, initial API keys, and seed service catalog if not already present.
    Safe to call multiple times (idempotent).
    """
    # 1. Admin user
    result = await db.execute(select(User).where(User.email == settings.ADMIN_DEFAULT_EMAIL))
    admin_user = result.scalar_one_or_none()

    created_admin = False
    if not admin_user:
        logger.info(f"Creating default admin account: {settings.ADMIN_DEFAULT_EMAIL}")
        admin_user = User(
            id=uuid.uuid4(),
            email=settings.ADMIN_DEFAULT_EMAIL,
            hashed_password=hash_password(settings.ADMIN_DEFAULT_PASSWORD),
            full_name=settings.ADMIN_DEFAULT_NAME,
            role="admin",
            is_active=True,
        )
        db.add(admin_user)
        await db.commit()
        await db.refresh(admin_user)
        created_admin = True

    # 2. Check for default API key
    created_key = None
    key_res = await db.execute(select(ApiKey).where(ApiKey.user_id == admin_user.id))
    existing_key = key_res.scalars().first()
    
    if not existing_key:
        full_key, key_prefix, hashed_key = generate_api_key("orv_live")
        admin_key = ApiKey(
            id=uuid.uuid4(),
            user_id=admin_user.id,
            name="Primary Admin Key",
            key_prefix=key_prefix,
            hashed_key=hashed_key,
            rate_limit_per_minute=1000,
            rate_limit_per_day=100000,
            is_active=True,
        )
        db.add(admin_key)
        await db.commit()
        created_key = full_key
        logger.info(f"Generated bootstrap API key: {full_key}")

    # 3. Seed Services Catalogue
    services_added = 0
    for svc_data in INITIAL_SERVICES:
        svc_res = await db.execute(select(ApiService).where(ApiService.slug == svc_data["slug"]))
        if not svc_res.scalar_one_or_none():
            service = ApiService(**svc_data)
            db.add(service)
            services_added += 1

    if services_added > 0:
        await db.commit()
        logger.info(f"Seeded {services_added} API services into catalogue.")

    return {
        "admin_created": created_admin,
        "admin_email": admin_user.email,
        "bootstrap_api_key": created_key,
        "services_seeded": services_added,
    }
