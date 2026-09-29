from typing import Optional, Literal
from pydantic import BaseModel, Field, HttpUrl


class QRCodeRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=2048, description="Content to encode in QR code")
    size: int = Field(default=10, ge=1, le=30, description="Box size per module")
    border: int = Field(default=2, ge=0, le=10, description="Border boxes")
    format: Literal["base64", "raw"] = Field(default="base64", description="Output format")


class QRCodeResponse(BaseModel):
    data_url: str
    format: str
    payload_length: int


class ClientIPResponse(BaseModel):
    ip: str
    protocol: str
    user_agent: str
    headers: dict


class HashRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=100000)
    algorithm: Literal["sha256", "sha512", "md5", "sha1"] = "sha256"


class HashResponse(BaseModel):
    algorithm: str
    digest: str
    input_length: int


class ImageInfoResponse(BaseModel):
    width: int
    height: int
    format: str
    mode: str
    size_bytes: int


class MediaInfoRequest(BaseModel):
    url: str = Field(..., min_length=4, max_length=2048)


class MediaInfoResponse(BaseModel):
    url: str
    accessible: bool
    status_code: int
    content_type: str
    content_length_bytes: Optional[int] = None
    etag: Optional[str] = None
    server: Optional[str] = None


class SocialPreviewRequest(BaseModel):
    url: str = Field(..., min_length=4, max_length=2048)


class SocialPreviewResponse(BaseModel):
    url: str
    title: Optional[str] = None
    description: Optional[str] = None
    image: Optional[str] = None
    site_name: Optional[str] = None
    favicon: Optional[str] = None
