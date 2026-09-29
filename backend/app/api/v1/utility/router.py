import io
import base64
import hashlib
from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi.responses import Response
import qrcode
from qrcode.image.pil import PilImage

from app.schemas.common import StandardResponse
from app.schemas.modules import (
    QRCodeRequest,
    QRCodeResponse,
    ClientIPResponse,
    HashRequest,
    HashResponse,
)
from app.api.dependencies import require_api_key

router = APIRouter(prefix="/utility", tags=["Utility APIs"])


@router.get("/health", response_model=StandardResponse[dict])
async def utility_health():
    """
    Standard platform health check endpoint (as specified in Requirement 32).
    """
    return StandardResponse.ok(
        data={"status": "healthy"},
        message="Service operational",
    )


@router.post("/qrcode", response_model=StandardResponse[QRCodeResponse])
async def generate_qrcode(
    payload: QRCodeRequest,
    auth=Depends(require_api_key),
):
    """
    High-performance vector/raster QR code generation.
    Supports Base64 data URL and binary PNG outputs.
    """
    try:
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=payload.size,
            border=payload.border,
        )
        qr.add_data(payload.text)
        qr.make(fit=True)

        img: PilImage = qr.make_image(fill_color="black", back_color="white")
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        buffer.seek(0)
        img_bytes = buffer.getvalue()

        if payload.format == "raw":
            return Response(content=img_bytes, media_type="image/png")

        b64_encoded = base64.b64encode(img_bytes).decode("utf-8")
        data_url = f"data:image/png;base64,{b64_encoded}"

        return StandardResponse.ok(
            data=QRCodeResponse(
                data_url=data_url,
                format="png",
                payload_length=len(payload.text),
            ),
            message="QR code generated successfully",
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={"code": "QR_GEN_ERROR", "message": f"Failed to generate QR code: {str(e)}"},
        )


@router.get("/ip", response_model=StandardResponse[ClientIPResponse])
async def get_client_ip(request: Request):
    """
    Client network inspection: extracts IP, headers, protocol, and proxy hops.
    """
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        client_ip = forwarded.split(",")[0].strip()
    else:
        client_ip = request.client.host if request.client else "127.0.0.1"

    headers_summary = {
        k: v for k, v in request.headers.items()
        if k.lower() in ["user-agent", "accept-language", "host", "x-real-ip"]
    }

    return StandardResponse.ok(
        data=ClientIPResponse(
            ip=client_ip,
            protocol=f"HTTP/{request.scope.get('http_version', '1.1')}",
            user_agent=request.headers.get("user-agent", "unknown"),
            headers=headers_summary,
        ),
        message="Client IP retrieved successfully",
    )


@router.post("/hash", response_model=StandardResponse[HashResponse])
async def compute_hash(
    payload: HashRequest,
    auth=Depends(require_api_key),
):
    """
    Computes cryptographic digests (SHA-256, SHA-512, MD5, SHA-1).
    """
    encoded = payload.text.encode("utf-8")
    if payload.algorithm == "sha256":
        digest = hashlib.sha256(encoded).hexdigest()
    elif payload.algorithm == "sha512":
        digest = hashlib.sha512(encoded).hexdigest()
    elif payload.algorithm == "md5":
        digest = hashlib.md5(encoded).hexdigest()
    elif payload.algorithm == "sha1":
        digest = hashlib.sha1(encoded).hexdigest()
    else:
        raise HTTPException(
            status_code=400,
            detail={"code": "UNSUPPORTED_ALGO", "message": f"Algorithm '{payload.algorithm}' not supported"},
        )

    return StandardResponse.ok(
        data=HashResponse(
            algorithm=payload.algorithm,
            digest=digest,
            input_length=len(payload.text),
        ),
        message="Hash calculated successfully",
    )
