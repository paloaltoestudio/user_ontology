import httpx
from typing import Optional, Dict, Any
from api.core.config import settings


class N8NClient:
    """Client for sending events to n8n webhooks"""

    def __init__(self, webhook_url: Optional[str] = None, api_key: Optional[str] = None):
        self.webhook_url = webhook_url or settings.N8N_WEBHOOK_URL
        self.api_key = api_key or settings.N8N_API_KEY

    async def send_event(
        self,
        event_type: str,
        user_id: int,
        event_data: Dict[str, Any],
    ) -> bool:
        """
        Send event to n8n webhook.

        Args:
            event_type: Type of event (e.g., "user_registered", "form_step_completed")
            user_id: ID of the user
            event_data: Additional event metadata

        Returns:
            True if successful, False otherwise
        """

        if not self.webhook_url:
            # Webhook not configured, skip
            return True

        payload = {
            "event_type": event_type,
            "user_id": user_id,
            "data": event_data,
        }

        headers = {}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    self.webhook_url,
                    json=payload,
                    headers=headers,
                )
                return response.status_code in (200, 201, 202, 204)
        except httpx.RequestError:
            # Log error but don't fail the request
            return False

    async def trigger_workflow(
        self,
        workflow_id: str,
        data: Dict[str, Any],
    ) -> bool:
        """
        Trigger an n8n workflow.

        Args:
            workflow_id: ID of the workflow
            data: Data to pass to the workflow

        Returns:
            True if successful, False otherwise
        """

        if not self.webhook_url:
            return True

        webhook_url = f"{self.webhook_url.rstrip('/')}/webhook/{workflow_id}"

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(webhook_url, json=data)
                return response.status_code in (200, 201, 202, 204)
        except httpx.RequestError:
            return False
