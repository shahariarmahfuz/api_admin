import io
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from fastapi.responses import StreamingResponse
from PIL import Image

from app.schemas.common import StandardResponse
from app.schemas.modules import ImageInfoResponse
from app.api.dependencies import require_api_key

router = APIRouter(prefix="/image", tags=["Image APIs"])


@router.post("/info", response_model=StandardResponse[ImageInfoResponse])
async def inspect_image_info(
    file: UploadFile = File(...),
    auth=Depends(require_api_key),
):
    """
    Inspects image format, dimensions, and color mode without decoding entire raster into RAM.
    """
    try:
        # Read header only via stream
        header = await file.read(4096)
        file_size = len(header)
        
        # Determine remaining size
        while chunk := await file.read(1024 * 64):
            file_size += len(chunk)

        # Reset to beginning for PIL inspection
        await file.seek(0)
        img = Image.open(file.file)
        width, height = img.size
        img_format = img.format or "UNKNOWN"
        mode = img.mode

        return StandardResponse.ok(
            data=ImageInfoResponse(
                width=width,
                height=height,
                format=img_format,
                mode=mode,
                size_bytes=file_size,
            ),
            message="Image metadata extracted successfully",
        )
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail={"code": "INVALID_IMAGE", "message": f"Could not parse image: {str(e)}"},
        )


@router.post("/resize")
async def resize_image(
    file: UploadFile = File(...),
    width: Optional[int] = Form(None),
    height: Optional[int] = Form(None),
    format: str = Form("webp"),
    auth=Depends(require_api_key),
):
    """
    Resize image with aspect ratio preservation and streaming binary response.
    """
    if not width and not height:
        raise HTTPException(
            status_code=400,
            detail={"code": "DIMENSIONS_REQUIRED", "message": "At least one of width or height is required"},
        )

    try:
        img = Image.open(file.file)
        orig_w, orig_h = img.size

        if width and not height:
            height = int(orig_h * (width / orig_w))
        elif height and not width:
            width = int(orig_w * (height / orig_h))

        # Clamp max dimensions for safety
        width = min(4096, max(1, width))
        height = min(4096, max(1, height))

        resized = img.resize((width, height), Image.Resampling.LANCZOS)
        out_format = format.upper()
        if out_format not in ["WEBP", "PNG", "JPEG"]:
            out_format = "WEBP"

        if out_format == "JPEG" and resized.mode in ("RGBA", "P"):
            resized = resized.convert("RGB")

        buffer = io.BytesIO()
        resized.save(buffer, format=out_format, quality=85)
        buffer.seek(0)

        mime_types = {
            "WEBP": "image/webp",
            "PNG": "image/png",
            "JPEG": "image/jpeg",
        }

        return StreamingResponse(
            buffer,
            media_type=mime_types.get(out_format, "image/webp"),
            headers={"Content-Disposition": f'inline; filename="resized.{out_format.lower()}"'},
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={"code": "IMAGE_PROCESSING_ERROR", "message": f"Failed to resize image: {str(e)}"},
        )
