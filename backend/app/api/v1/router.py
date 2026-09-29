from fastapi import APIRouter

from app.api.v1.auth.router import router as auth_router
from app.api.v1.admin.router import router as admin_router
from app.api.v1.admin.providers_router import router as providers_router
from app.api.v1.admin.test_router import router as tester_router
from app.api.v1.users.router import router as users_router
from app.api.v1.api_keys.router import router as api_keys_router
from app.api.v1.services.router import router as services_router
from app.api.v1.logs.router import router as logs_router
from app.api.v1.utility.router import router as utility_router
from app.api.v1.image.router import router as image_router
from app.api.v1.media.router import router as media_router
from app.api.v1.social.router import router as social_router
from app.api.v1.cloudinary.router import router as cloudinary_router

api_v1_router = APIRouter()

# Core Platform Routes
api_v1_router.include_router(auth_router)
api_v1_router.include_router(admin_router)
api_v1_router.include_router(providers_router)
api_v1_router.include_router(tester_router)
api_v1_router.include_router(users_router)
api_v1_router.include_router(api_keys_router)
api_v1_router.include_router(services_router)
api_v1_router.include_router(logs_router)

# Extensible API Modules & Providers
api_v1_router.include_router(utility_router)
api_v1_router.include_router(image_router)
api_v1_router.include_router(media_router)
api_v1_router.include_router(social_router)
api_v1_router.include_router(cloudinary_router)


@api_v1_router.get("/health")
async def v1_health():
    return {
        "success": True,
        "data": {
            "status": "healthy",
        },
        "message": "Internal API Gateway operational",
    }

