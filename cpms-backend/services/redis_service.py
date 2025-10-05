import redis
import json
import os
from typing import Optional, Dict, Any

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

class RedisService:
    def __init__(self):
        self.redis_client = redis.Redis.from_url(REDIS_URL, decode_responses=True)

    def set_charge_point_status(self, charge_point_id: int, status_data: Dict[str, Any]):
        """Store charge point status in Redis"""
        key = f"charge_point:{charge_point_id}:status"
        self.redis_client.set(key, json.dumps(status_data))
        self.redis_client.publish("charge_point_updates", json.dumps({
            "charge_point_id": charge_point_id,
            "status": status_data
        }))

    def get_charge_point_status(self, charge_point_id: int) -> Optional[Dict[str, Any]]:
        """Get charge point status from Redis"""
        key = f"charge_point:{charge_point_id}:status"
        data = self.redis_client.get(key)
        return json.loads(data) if data else None

    def set_charging_session(self, session_id: int, session_data: Dict[str, Any]):
        """Store charging session data in Redis"""
        key = f"charging_session:{session_id}"
        self.redis_client.set(key, json.dumps(session_data))

    def get_charging_session(self, session_id: int) -> Optional[Dict[str, Any]]:
        """Get charging session data from Redis"""
        key = f"charging_session:{session_id}"
        data = self.redis_client.get(key)
        return json.loads(data) if data else None

    def delete_charging_session(self, session_id: int):
        """Delete charging session from Redis"""
        key = f"charging_session:{session_id}"
        self.redis_client.delete(key)

    def publish_websocket_message(self, channel: str, message: Dict[str, Any]):
        """Publish message to Redis channel for WebSocket distribution"""
        self.redis_client.publish(channel, json.dumps(message))

# Global Redis service instance
redis_service = RedisService()