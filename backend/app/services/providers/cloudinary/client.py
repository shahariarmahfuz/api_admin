import time
import hashlib
from typing import Dict, Any, Tuple, Optional
import httpx
from app.utils.http_client import get_http_client
from app.core.logging import logger


class CloudinaryClient:
    def __init__(self, cloud_name: str, api_key: str, api_secret: str, upload_preset: Optional[str] = None):
        self.cloud_name = cloud_name.strip()
        self.api_key = api_key.strip()
        self.api_secret = api_secret.strip()
        self.upload_preset = upload_preset.strip() if upload_preset else None
        self.base_url = f"https://api.cloudinary.com/v1_1/{self.cloud_name}"

    def _generate_signature(self, params: Dict[str, Any]) -> str:
        """
        Generate Cloudinary SHA-1 signature.
        Sorted alphabetically by key, format key=value&key2=value2 + api_secret.
        """
        filtered_params = {
            k: v for k, v in params.items()
            if v is not None and k not in ["file", "cloud_name", "resource_type", "api_key", "signature"]
        }
        sorted_keys = sorted(filtered_params.keys())
        query_string = "&".join(f"{k}={filtered_params[k]}" for k in sorted_keys)
        to_sign = f"{query_string}{self.api_secret}"
        return hashlib.sha1(to_sign.encode("utf-8")).hexdigest()

    async def ping_connection(self) -> Tuple[bool, str]:
        """
        Test Cloudinary credentials against the Cloudinary Admin API.
        Does not expose raw secrets in error messages.
        """
        if not self.cloud_name or not self.api_key or not self.api_secret:
            return False, "Missing cloud_name, api_key, or api_secret"

        client = get_http_client()
        url = f"{self.base_url}/resources/image"
        try:
            # Query admin resources with max_results=1 using HTTP Basic Auth
            resp = await client.get(
                url,
                params={"max_results": 1},
                auth=(self.api_key, self.api_secret),
                timeout=10.0,
            )

            if resp.status_code == 200:
                data = resp.json()
                total = len(data.get("resources", []))
                return True, f"Connection successful. Cloudinary account '{self.cloud_name}' verified."
            
            # Error handling
            if resp.status_code == 401:
                return False, "Authentication failed. Invalid API Key or API Secret."
            elif resp.status_code == 404:
                return False, f"Cloud Name '{self.cloud_name}' not found on Cloudinary."
            else:
                err_msg = resp.json().get("error", {}).get("message", f"HTTP {resp.status_code}")
                return False, f"Cloudinary error: {err_msg}"
        except httpx.RequestError as e:
            return False, f"Network error connecting to Cloudinary: {str(e)}"

    async def upload_asset(
        self,
        file_data: Any = None,
        file_url: Optional[str] = None,
        folder: Optional[str] = None,
        public_id: Optional[str] = None,
        tags: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Upload binary image file or remote URL to Cloudinary.
        """
        client = get_http_client()
        url = f"{self.base_url}/image/upload"
        timestamp = int(time.time())

        data: Dict[str, Any] = {"timestamp": timestamp}
        if folder:
            data["folder"] = folder
        if public_id:
            data["public_id"] = public_id
        if tags:
            data["tags"] = tags

        files = None
        if file_url:
            data["file"] = file_url
        elif file_data:
            files = {"file": file_data}

        # Check signed vs unsigned preset
        if self.upload_preset and not self.api_secret:
            data["upload_preset"] = self.upload_preset
        else:
            # Signed upload
            data["api_key"] = self.api_key
            data["signature"] = self._generate_signature(data)

        resp = await client.post(url, data=data, files=files, timeout=30.0)
        result = resp.json()
        if resp.status_code >= 400:
            err_msg = result.get("error", {}).get("message", "Upload failed")
            raise ValueError(f"Cloudinary upload error: {err_msg}")

        return {
            "public_id": result.get("public_id"),
            "secure_url": result.get("secure_url"),
            "url": result.get("url"),
            "format": result.get("format"),
            "width": result.get("width"),
            "height": result.get("height"),
            "bytes": result.get("bytes"),
            "created_at": result.get("created_at"),
            "resource_type": result.get("resource_type"),
        }

    async def get_resource(self, public_id: str) -> Dict[str, Any]:
        """
        Get metadata and details of an existing Cloudinary asset.
        """
        client = get_http_client()
        url = f"{self.base_url}/resources/image/upload/{public_id}"
        resp = await client.get(url, auth=(self.api_key, self.api_secret), timeout=15.0)
        result = resp.json()

        if resp.status_code >= 400:
            err_msg = result.get("error", {}).get("message", "Resource not found")
            raise ValueError(f"Cloudinary resource error: {err_msg}")

        return {
            "public_id": result.get("public_id"),
            "format": result.get("format"),
            "version": result.get("version"),
            "resource_type": result.get("resource_type"),
            "created_at": result.get("created_at"),
            "bytes": result.get("bytes"),
            "width": result.get("width"),
            "height": result.get("height"),
            "url": result.get("url"),
            "secure_url": result.get("secure_url"),
        }

    async def delete_resource(self, public_id: str) -> Dict[str, Any]:
        """
        Delete an asset from Cloudinary by public_id.
        """
        client = get_http_client()
        url = f"{self.base_url}/image/destroy"
        timestamp = int(time.time())

        params = {
            "public_id": public_id,
            "timestamp": timestamp,
        }
        params["api_key"] = self.api_key
        params["signature"] = self._generate_signature(params)

        resp = await client.post(url, data=params, timeout=15.0)
        result = resp.json()

        if resp.status_code >= 400 or result.get("result") != "ok":
            err_msg = result.get("error", {}).get("message") or result.get("result") or "Deletion failed"
            raise ValueError(f"Cloudinary delete error: {err_msg}")

        return {"result": result.get("result", "ok"), "public_id": public_id}

    def generate_transformed_url(
        self,
        public_id: str,
        width: Optional[int] = None,
        height: Optional[int] = None,
        crop: Optional[str] = None,
        format: Optional[str] = None,
    ) -> str:
        """
        Generate optimized delivery URL with on-the-fly transformations.
        """
        transforms = []
        if width:
            transforms.append(f"w_{width}")
        if height:
            transforms.append(f"h_{height}")
        if crop:
            transforms.append(f"c_{crop}")
        if format and format != "auto":
            transforms.append(f"f_{format}")
        else:
            transforms.append("f_auto,q_auto")

        trans_str = ",".join(transforms) if transforms else "q_auto,f_auto"
        return f"https://res.cloudinary.com/{self.cloud_name}/image/upload/{trans_str}/{public_id}"
