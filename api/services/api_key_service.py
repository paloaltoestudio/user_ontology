import logging
import secrets
from datetime import datetime
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from models.api_key import ApiKey

logger = logging.getLogger(__name__)


def generate_api_key() -> str:
    """Generate a secure random API key with 'sk_' prefix"""
    return f"sk_{secrets.token_urlsafe(32)}"


async def validate_api_key(key: str, db: AsyncSession) -> ApiKey | None:
    """
    Validate an API key and return the key object if valid.
    Updates last_used_at timestamp.

    Args:
        key: The API key to validate
        db: Database session

    Returns:
        ApiKey object if valid and active, None otherwise
    """
    result = await db.execute(
        select(ApiKey).where(and_(ApiKey.key == key, ApiKey.is_active == True))
    )
    api_key = result.scalars().first()

    if api_key:
        # Update last_used_at
        api_key.last_used_at = datetime.utcnow()
        await db.commit()
        logger.debug(f"API key validated: {key[:10]}...")
        return api_key

    logger.warning(f"Invalid or inactive API key attempted: {key[:10]}...")
    return None


async def validate_api_key_scope(
    key: str,
    required_scope: str,
    db: AsyncSession
) -> tuple[bool, ApiKey | None]:
    """
    Validate an API key and check if it has the required scope.

    Args:
        key: The API key to validate
        required_scope: The scope required (e.g., 'goals', 'webhooks')
        db: Database session

    Returns:
        Tuple of (is_valid: bool, api_key: ApiKey | None)
        is_valid is True only if key exists, is active, and has the required scope
    """
    api_key = await validate_api_key(key, db)

    if not api_key:
        return False, None

    if not api_key.has_scope(required_scope):
        logger.warning(
            f"API key {api_key.id} lacks required scope '{required_scope}'. "
            f"Available scopes: {api_key.scopes}"
        )
        return False, api_key

    return True, api_key
