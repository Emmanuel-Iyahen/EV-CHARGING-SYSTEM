# services/ocpp_service.py
import logging
from datetime import datetime
from typing import Dict, Any

logger = logging.getLogger(__name__)

class OCPPService:
    def __init__(self):
        self.connected_charge_points: Dict[str, Any] = {}
        self.connection_events = []

    def register_charge_point(self, charge_point_id, ocpp_charge_point):
        """Register a connected charge point"""
        self.connected_charge_points[charge_point_id] = ocpp_charge_point
        event = {
            "timestamp": datetime.now().isoformat(),
            "charge_point_id": charge_point_id,
            "event": "connected",
            "connected_count": len(self.connected_charge_points)
        }
        self.connection_events.append(event)
        logger.info(f"Charge point {charge_point_id} registered. Total connected: {len(self.connected_charge_points)}")

    def unregister_charge_point(self, charge_point_id):
        """Unregister a disconnected charge point"""
        if charge_point_id in self.connected_charge_points:
            del self.connected_charge_points[charge_point_id]
            event = {
                "timestamp": datetime.now().isoformat(),
                "charge_point_id": charge_point_id,
                "event": "disconnected",
                "connected_count": len(self.connected_charge_points)
            }
            self.connection_events.append(event)
            logger.info(f"Charge point {charge_point_id} unregistered. Total connected: {len(self.connected_charge_points)}")

    def get_connection_stats(self):
        """Get connection statistics"""
        return {
            "total_connected": len(self.connected_charge_points),
            "connected_ids": list(self.connected_charge_points.keys()),
            "recent_events": self.connection_events[-10:]
        }

ocpp_service = OCPPService()