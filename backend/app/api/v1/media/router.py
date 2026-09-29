from fastapi import APIRouter, Depends, HTTPException
import httpx

from app.schemas.common import StandardResponse
from app.schemas.modules import MediaInfoRequest, MediaInfoResponse
from app.api.dependencies import require_api_key
from app.utils.http_client import get_http_client

router = APIRouter(prefix="/media", tags=["Media APIs"])


@router.post("/info", response_model=StandardResponse[MediaInfoResponse])
async def inspect_media_url(
    payload: MediaInfoRequest,
    auth=Depends(require_api_key),
):
    """
    Inspects remote media headers (mime-type, length, etag) safely without downloading full body into RAM.
    Uses pooled persistent HTTP connection.
    """
    client = get_http_client()
    try:
        # Use HEAD request to inspect headers without downloading body
        resp = await client.head(payload.url)
        if resp.status_code >= 400:
            # Fallback to GET stream with 1 byte range if HEAD is not supported by target server
            resp = await client.get(payload.url, headers={"Range": "bytes=0-0"})

        content_length = None
        if "content-length" in resp.headers:
            try:
                content_length = int(resp.headers["content-length"])
            except ValueError:
                pass

        return StandardResponse.ok(
            data=MediaInfoResponse(
                url=payload.url,
                accessible=resp.status_code < 400,
                status_code=resp.status_code,
                content_type=resp.headers.get("content-type", "application/octet-stream"),
                content_length_bytes=content_length,
                etag=resp.headers.get("etag"),
                server=resp.headers.get("server"),
            ),
            message="Media URL inspected successfully",
        )
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=400,
            detail={"code": "FETCH_FAILED", "message": f"Could not reach remote URL: {str(e)}"},
        )
