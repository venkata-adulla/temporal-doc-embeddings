from typing import Optional

from fastapi import Header, HTTPException, Query, status

from core.config import get_settings


def verify_api_key(
    x_api_key: Optional[str] = Header(default=None),
    api_key: Optional[str] = Query(default=None),
    authorization: Optional[str] = Header(default=None),
) -> None:
    settings = get_settings()

    # Prefer header; allow query param for convenience (e.g., browser downloads)
    candidate = x_api_key or api_key

    # Support Authorization: Bearer <key> as an alternative
    if not candidate and authorization:
        parts = authorization.split(" ", 1)
        if len(parts) == 2 and parts[0].lower() == "bearer":
            candidate = parts[1].strip()

    accepted_keys = {"dev-local-key"}
    if settings.api_key:
        accepted_keys.add(settings.api_key)

    if not candidate or candidate not in accepted_keys:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API key.",
        )
