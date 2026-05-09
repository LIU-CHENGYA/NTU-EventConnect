import secrets
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from app.core.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/uploads", tags=["uploads"])

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

ALLOWED_EXT = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
MAX_BYTES = 5 * 1024 * 1024  # 5 MB


def _sniff_image(data: bytes) -> str | None:
    """Return canonical extension based on file magic bytes, or None."""
    if len(data) < 12:
        return None
    if data[:3] == b"\xff\xd8\xff":
        return ".jpg"
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        return ".png"
    if data[:6] in (b"GIF87a", b"GIF89a"):
        return ".gif"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return ".webp"
    return None


@router.post("", status_code=201)
async def upload_image(
    file: UploadFile = File(...),
    current: User = Depends(get_current_user),
):
    ext = Path(file.filename or "").suffix.lower()
    if ext == ".jpeg":
        ext = ".jpg"
    if ext not in ALLOWED_EXT:
        raise HTTPException(400, f"File type {ext} not allowed")

    data = await file.read()
    if not data:
        raise HTTPException(400, "Empty file")
    if len(data) > MAX_BYTES:
        raise HTTPException(400, "File too large (max 5MB)")

    sniffed = _sniff_image(data)
    if sniffed is None:
        raise HTTPException(400, "File content is not a recognised image")
    if ext != sniffed:
        raise HTTPException(400, "File extension does not match file content")

    # Filename is fully generated; user input never reaches the path → no traversal.
    name = f"{secrets.token_hex(16)}{sniffed}"
    dest = UPLOAD_DIR / name
    dest.write_bytes(data)
    return {"url": f"/uploads/{name}", "filename": name, "size": len(data)}
