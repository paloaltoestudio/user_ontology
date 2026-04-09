from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from typing import Optional
from models.user import User
from models.scoring_rule import ScoringRule


async def calculate_user_score(user_id: int, db: AsyncSession) -> int:
    """
    Calculate and update user's lead score based on ScoringRules and user metadata.

    Algorithm:
    1. Fetch the user and their metadata
    2. Fetch all active scoring rules
    3. For each rule, check if the condition matches user metadata
    4. Sum up points for all matching rules
    5. Update user's lead_score in database
    6. Return the new score

    Args:
        user_id: The user ID to calculate score for
        db: Database session

    Returns:
        The updated lead score

    Raises:
        ValueError: If user not found
    """

    # Fetch user
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()

    if not user:
        raise ValueError(f"User with id {user_id} not found")

    # Fetch all active scoring rules
    result = await db.execute(
        select(ScoringRule).where(ScoringRule.is_active == 1)
    )
    scoring_rules = result.scalars().all()

    # Calculate total points
    total_points = 0

    for rule in scoring_rules:
        if _evaluate_rule(rule, user.user_metadata):
            total_points += rule.points

    # Update user's lead score
    await db.execute(
        update(User).where(User.id == user_id).values(lead_score=total_points)
    )
    await db.commit()

    # Refresh user to get updated score
    await db.refresh(user)

    return user.lead_score


def _evaluate_rule(rule: ScoringRule, user_metadata: dict) -> bool:
    """
    Evaluate if a scoring rule matches the user's metadata.

    Supported operators:
    - "equals": Exact match (case-insensitive for strings)
    - "contains": Check if value is contained in metadata value
    - "greater_than": Numeric comparison
    - "less_than": Numeric comparison
    - "greater_than_or_equal": Numeric comparison
    - "less_than_or_equal": Numeric comparison
    - "exists": Check if field_key exists in metadata

    Args:
        rule: The scoring rule to evaluate
        user_metadata: The user's metadata dictionary

    Returns:
        True if rule matches, False otherwise
    """

    field_value = user_metadata.get(rule.field_key)

    if field_value is None and rule.operator != "exists":
        return False

    operator = rule.operator.lower()

    try:
        if operator == "equals":
            if isinstance(field_value, bool):
                return field_value == (rule.value.lower() == "true")
            return str(field_value).lower() == rule.value.lower()

        elif operator == "contains":
            return rule.value.lower() in str(field_value).lower()

        elif operator == "greater_than":
            return float(field_value) > float(rule.value)

        elif operator == "less_than":
            return float(field_value) < float(rule.value)

        elif operator == "greater_than_or_equal":
            return float(field_value) >= float(rule.value)

        elif operator == "less_than_or_equal":
            return float(field_value) <= float(rule.value)

        elif operator == "exists":
            return rule.field_key in user_metadata

        else:
            # Unknown operator, rule does not match
            return False

    except (ValueError, TypeError):
        # Type conversion error, rule does not match
        return False
