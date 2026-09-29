from typing import Dict, Any, List, Tuple, Optional
from app.services.providers.base import BaseProvider
from app.services.providers.cloudinary.client import CloudinaryClient


class CloudinaryProvider(BaseProvider):
    name = "cloudinary"
    display_name = "Cloudinary"
    description = "Cloud image & video upload, media transformation, asset storage, and optimization."
    category = "image"

    credential_schema: List[Dict[str, Any]] = [
        {
            "key": "cloud_name",
            "label": "Cloud Name",
            "type": "text",
            "required": True,
            "placeholder": "e.g. diwp8ug1r",
            "description": "Your Cloudinary account cloud identifier",
        },
        {
            "key": "api_key",
            "label": "API Key",
            "type": "text",
            "required": True,
            "placeholder": "e.g. 123456789012345",
            "description": "Public API Key from your Cloudinary console",
        },
        {
            "key": "api_secret",
            "label": "API Secret",
            "type": "password",
            "required": True,
            "placeholder": "••••••••••••••••••••••••••••",
            "description": "Private API Secret used to sign administrative requests",
        },
        {
            "key": "upload_preset",
            "label": "Upload Preset (Optional)",
            "type": "text",
            "required": False,
            "placeholder": "e.g. my_unsigned_preset",
            "description": "Optional preset for direct or client uploads",
        },
    ]

    operations: List[Dict[str, Any]] = [
        {
            "id": "upload_image",
            "name": "Upload Media / Image",
            "description": "Upload a binary image or remote image URL directly to Cloudinary",
            "method": "POST",
            "endpoint": "/api/v1/cloudinary/upload",
            "parameters": [
                {
                    "name": "file_url",
                    "type": "string",
                    "required": False,
                    "description": "Public URL of image to upload (or upload file below)",
                    "placeholder": "https://example.com/photo.jpg",
                },
                {
                    "name": "folder",
                    "type": "string",
                    "required": False,
                    "description": "Target folder in your Cloudinary media library",
                    "placeholder": "e.g. uploads",
                },
                {
                    "name": "public_id",
                    "type": "string",
                    "required": False,
                    "description": "Optional custom unique identifier for the asset",
                    "placeholder": "e.g. hero_banner_1",
                },
                {
                    "name": "tags",
                    "type": "string",
                    "required": False,
                    "description": "Comma-separated search tags",
                    "placeholder": "e.g. profile, avatar, featured",
                },
            ],
            "supports_file_upload": True,
        },
        {
            "id": "get_resource",
            "name": "Get Resource Metadata",
            "description": "Fetch dimensions, bytes, URLs, and formats of an existing Cloudinary asset",
            "method": "GET",
            "endpoint": "/api/v1/cloudinary/resource",
            "parameters": [
                {
                    "name": "public_id",
                    "type": "string",
                    "required": True,
                    "description": "Asset public ID in Cloudinary",
                    "placeholder": "e.g. sample or uploads/hero_banner_1",
                },
            ],
            "supports_file_upload": False,
        },
        {
            "id": "generate_url",
            "name": "Generate Transformed URL",
            "description": "Compute a CDN delivery URL with dynamic cropping, WebP conversion, and quality flags",
            "method": "POST",
            "endpoint": "/api/v1/cloudinary/transform",
            "parameters": [
                {
                    "name": "public_id",
                    "type": "string",
                    "required": True,
                    "description": "Cloudinary asset public ID",
                    "placeholder": "e.g. sample",
                },
                {
                    "name": "width",
                    "type": "integer",
                    "required": False,
                    "description": "Target width (px)",
                    "placeholder": "500",
                },
                {
                    "name": "height",
                    "type": "integer",
                    "required": False,
                    "description": "Target height (px)",
                    "placeholder": "500",
                },
                {
                    "name": "crop",
                    "type": "string",
                    "required": False,
                    "description": "Crop mode: fill, scale, crop, thumb",
                    "placeholder": "fill",
                },
                {
                    "name": "format",
                    "type": "string",
                    "required": False,
                    "description": "Output format: auto, webp, png, jpg",
                    "placeholder": "auto",
                },
            ],
            "supports_file_upload": False,
        },
        {
            "id": "delete_resource",
            "name": "Delete Resource",
            "description": "Permanently destroy an asset from Cloudinary storage",
            "method": "DELETE",
            "endpoint": "/api/v1/cloudinary/resource",
            "parameters": [
                {
                    "name": "public_id",
                    "type": "string",
                    "required": True,
                    "description": "Asset public ID to delete",
                    "placeholder": "e.g. uploads/hero_banner_1",
                },
            ],
            "supports_file_upload": False,
        },
    ]

    async def test_connection(self, credentials: Dict[str, Any]) -> Tuple[bool, str]:
        cloud_name = credentials.get("cloud_name")
        api_key = credentials.get("api_key")
        api_secret = credentials.get("api_secret")
        upload_preset = credentials.get("upload_preset")

        if not cloud_name or not api_key or not api_secret:
            return False, "Cloud Name, API Key, and API Secret are all required."

        client = CloudinaryClient(cloud_name, api_key, api_secret, upload_preset)
        return await client.ping_connection()

    async def execute_operation(
        self,
        operation: str,
        credentials: Dict[str, Any],
        params: Dict[str, Any],
        files: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        client = CloudinaryClient(
            cloud_name=credentials.get("cloud_name", ""),
            api_key=credentials.get("api_key", ""),
            api_secret=credentials.get("api_secret", ""),
            upload_preset=credentials.get("upload_preset"),
        )

        if operation == "upload_image":
            file_data = files.get("file") if files else None
            return await client.upload_asset(
                file_data=file_data,
                file_url=params.get("file_url") or params.get("file"),
                folder=params.get("folder"),
                public_id=params.get("public_id"),
                tags=params.get("tags"),
            )
        elif operation == "get_resource":
            public_id = params.get("public_id")
            if not public_id:
                raise ValueError("public_id is required")
            return await client.get_resource(public_id)
        elif operation == "delete_resource":
            public_id = params.get("public_id")
            if not public_id:
                raise ValueError("public_id is required")
            return await client.delete_resource(public_id)
        elif operation == "generate_url":
            public_id = params.get("public_id")
            if not public_id:
                raise ValueError("public_id is required")
            url = client.generate_transformed_url(
                public_id=public_id,
                width=int(params["width"]) if params.get("width") else None,
                height=int(params["height"]) if params.get("height") else None,
                crop=params.get("crop"),
                format=params.get("format"),
            )
            return {"public_id": public_id, "transformed_url": url}
        else:
            raise ValueError(f"Unsupported Cloudinary operation: {operation}")
