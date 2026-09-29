import json
from typing import Dict, Any, Optional
from cryptography.fernet import Fernet
from app.core.config import settings
from app.core.logging import logger

_fernet_instance: Optional[Fernet] = None


def get_fernet() -> Fernet:
    global _fernet_instance
    if _fernet_instance is None:
        key = settings.CREDENTIAL_ENCRYPTION_KEY.strip()
        if not key:
            key = Fernet.generate_key().decode()
            logger.warning("CREDENTIAL_ENCRYPTION_KEY not set in env; using transient Fernet key")
        try:
            _fernet_instance = Fernet(key.encode() if isinstance(key, str) else key)
        except Exception as e:
            logger.error(f"Invalid encryption key, generating fallback: {e}")
            _fernet_instance = Fernet(Fernet.generate_key())
    return _fernet_instance


def encrypt_value(value: str) -> str:
    """Encrypt a single plaintext string."""
    if not value:
        return ""
    fernet = get_fernet()
    return fernet.encrypt(value.encode("utf-8")).decode("utf-8")


def decrypt_value(encrypted_value: str) -> str:
    """Decrypt a ciphertext string back to plaintext."""
    if not encrypted_value:
        return ""
    fernet = get_fernet()
    try:
        return fernet.decrypt(encrypted_value.encode("utf-8")).decode("utf-8")
    except Exception as e:
        logger.error(f"Decryption failed: {e}")
        return ""


def encrypt_credentials(creds: Dict[str, Any]) -> str:
    """Serialize and encrypt a dictionary of credentials into a ciphertext string."""
    plaintext = json.dumps(creds)
    return encrypt_value(plaintext)


def decrypt_credentials(encrypted_blob: str) -> Dict[str, Any]:
    """Decrypt and deserialize a ciphertext string into a credentials dictionary."""
    if not encrypted_blob:
        return {}
    decrypted_json = decrypt_value(encrypted_blob)
    if not decrypted_json:
        return {}
    try:
        return json.loads(decrypted_json)
    except Exception:
        return {}


def mask_secret(value: str) -> str:
    """Mask a sensitive credential for safe admin display."""
    if not value:
        return ""
    if len(value) <= 6:
        return "••••••••"
    return f"{value[:3]}••••••••{value[-3:]}"
