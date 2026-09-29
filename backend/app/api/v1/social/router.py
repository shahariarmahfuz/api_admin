import re
from urllib.parse import urljoin
from fastapi import APIRouter, Depends, HTTPException
import httpx

from app.schemas.common import StandardResponse
from app.schemas.modules import SocialPreviewRequest, SocialPreviewResponse
from app.api.dependencies import require_api_key
from app.utils.http_client import get_http_client

router = APIRouter(prefix="/social", tags=["Social APIs"])


def _extract_meta_property(html: str, prop: str) -> str:
    # Match both property="og:..." and name="og:..."
    patterns = [
        rf'<meta\s+[^>]*property=["\']{prop}["\'][^>]*content=["\']([^"\']+)["\']',
        rf'<meta\s+[^>]*content=["\']([^"\']+)["\'][^>]*property=["\']{prop}["\']',
        rf'<meta\s+[^>]*name=["\']{prop}["\'][^>]*content=["\']([^"\']+)["\']',
        rf'<meta\s+[^>]*content=["\']([^"\']+)["\'][^>]*name=["\']{prop}["\']',
    ]
    for pattern in patterns:
        match = re.search(pattern, html, re.IGNORECASE)
        if match:
            return match.group(1).strip()
    return ""


@router.post("/preview", response_model=StandardResponse[SocialPreviewResponse])
async def get_social_preview(
    payload: SocialPreviewRequest,
    auth=Depends(require_api_key),
):
    """
    Extracts OpenGraph, Twitter Card, and title metadata for rich social card rendering.
    """
    client = get_http_client()
    try:
        # Stream read only the first 64KB (head portion) to avoid memory overload
        async with client.stream("GET", payload.url) as response:
            if response.status_code >= 400:
                raise HTTPException(
                    status_code=400,
                    detail={"code": "PAGE_UNAVAILABLE", "message": f"URL returned status {response.status_code}"},
                )
            
            chunks = []
            bytes_read = 0
            async for chunk in response.aiter_bytes():
                chunks.append(chunk)
                bytes_read += len(chunk)
                if bytes_read > 64 * 1024 or b"</head>" in chunk:
                    break

            html = b"".join(chunks).decode("utf-8", errors="ignore")

        # Extract title
        title = _extract_meta_property(html, "og:title") or _extract_meta_property(html, "twitter:title")
        if not title:
            title_match = re.search(r"<title[^>]*>(.*?)</title>", html, re.IGNORECASE | re.DOTALL)
            if title_match:
                title = title_match.group(1).strip()

        # Extract description
        description = (
            _extract_meta_property(html, "og:description")
            or _extract_meta_property(html, "twitter:description")
            or _extract_meta_property(html, "description")
        )

        # Extract image
        image = _extract_meta_property(html, "og:image") or _extract_meta_property(html, "twitter:image")
        if image:
            image = urljoin(payload.url, image)

        # Extract site name
        site_name = _extract_meta_property(html, "og:site_name")

        # Favicon
        favicon = urljoin(payload.url, "/favicon.ico")

        return StandardResponse.ok(
            data=SocialPreviewResponse(
                url=payload.url,
                title=title or None,
                description=description or None,
                image=image or None,
                site_name=site_name or None,
                favicon=favicon,
            ),
            message="Social card metadata extracted successfully",
        )
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=400,
            detail={"code": "FETCH_FAILED", "message": f"Could not fetch URL: {str(e)}"},
        )
