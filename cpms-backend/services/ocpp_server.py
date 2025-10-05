# services/ocpp_server.py
import asyncio
import logging
from ocpp.routing import on
from ocpp.v16 import ChargePoint as OCPPChargePoint
from ocpp.v16 import call_result
from ocpp.v16.enums import Action, RegistrationStatus, ChargePointStatus as OCPPStatus
from datetime import datetime
from aiohttp import web

logger = logging.getLogger(__name__)

class OCPPChargePointHandler(OCPPChargePoint):
    def __init__(self, charge_point_id, connection):
        super().__init__(charge_point_id, connection)
        self.charge_point_id = charge_point_id
        logger.info(f"Created OCPP handler for {charge_point_id}")

    async def start(self):
        """Start handling OCPP messages for this charge point"""
        logger.info(f"Starting OCPP communication with {self.charge_point_id}")
        try:
            await super().start()
        except Exception as e:
            logger.error(f"Error in OCPP communication with {self.charge_point_id}: {e}")
        finally:
            logger.info(f"OCPP communication ended with {self.charge_point_id}")
    
    @on(Action.BootNotification)
    async def on_boot_notification(self, charge_point_vendor, charge_point_model, **kwargs):
        logger.info(f"📦 BootNotification from {self.charge_point_id} - {charge_point_vendor} {charge_point_model}")
        
        return call_result.BootNotificationPayload(
            current_time=datetime.utcnow().isoformat(),
            interval=300,  # 5 minutes
            status=RegistrationStatus.accepted
        )

    @on(Action.Heartbeat)
    async def on_heartbeat(self):
        logger.debug(f"💓 Heartbeat from {self.charge_point_id}")
        
        return call_result.HeartbeatPayload(
            current_time=datetime.utcnow().isoformat()
        )

    @on(Action.StatusNotification)
    async def on_status_notification(self, connector_id, error_code, status, **kwargs):
        logger.info(f"📊 StatusNotification from {self.charge_point_id}: connector={connector_id}, status={status}")
        
        return call_result.StatusNotificationPayload()

    @on(Action.StartTransaction)
    async def on_start_transaction(self, connector_id, id_tag, meter_start, timestamp, **kwargs):
        logger.info(f"⚡ StartTransaction from {self.charge_point_id}: connector={connector_id}, id_tag={id_tag}")
        
        # Create a simple transaction ID
        transaction_id = int(datetime.utcnow().timestamp())
        
        return call_result.StartTransactionPayload(
            transaction_id=transaction_id,
            id_tag_info={"status": "Accepted"}
        )

    @on(Action.StopTransaction)
    async def on_stop_transaction(self, transaction_id, meter_stop, timestamp, **kwargs):
        logger.info(f"🛑 StopTransaction from {self.charge_point_id}: transaction={transaction_id}")
        
        return call_result.StopTransactionPayload(
            id_tag_info={"status": "Accepted"}
        )

    @on(Action.MeterValues)
    async def on_meter_values(self, connector_id, meter_value, **kwargs):
        logger.debug(f"📈 MeterValues from {self.charge_point_id}: connector={connector_id}")
        
        return call_result.MeterValuesPayload()

    @on(Action.Authorize)
    async def on_authorize(self, id_tag, **kwargs):
        logger.info(f"🔑 Authorize from {self.charge_point_id}: id_tag={id_tag}")
        
        return call_result.AuthorizePayload(
            id_tag_info={"status": "Accepted"}
        )
    



# services/ocpp_server.py (continued)
connected_charge_points = {}

async def on_connect(request):
    """Handle OCPP WebSocket connection from charge points"""
    charge_point_id = request.match_info['charge_point_id']
    
    logger.info(f"🔌 New WebSocket connection from charge point: {charge_point_id}")
    
    # Create WebSocket response
    ws = web.WebSocketResponse()
    await ws.prepare(request)
    
    # Create OCPP charge point handler
    charge_point = OCPPChargePointHandler(charge_point_id, ws)
    
    # Store the connection
    connected_charge_points[charge_point_id] = charge_point
    logger.info(f"✅ Charge point {charge_point_id} registered. Total connected: {len(connected_charge_points)}")
    
    try:
        # Start handling OCPP messages
        await charge_point.start()
    except Exception as e:
        logger.error(f"❌ Error with charge point {charge_point_id}: {e}")
    finally:
        # Remove from connected points
        if charge_point_id in connected_charge_points:
            del connected_charge_points[charge_point_id]
            logger.info(f"📴 Charge point {charge_point_id} disconnected. Total connected: {len(connected_charge_points)}")
    
    return ws

def create_ocpp_server():
    """Create OCPP WebSocket server"""
    app = web.Application()
    
    # Add OCPP WebSocket route
    app.router.add_get('/ocpp/{charge_point_id}', on_connect)
    
    # Add status endpoint
    async def status_handler(request):
        return web.json_response({
            "status": "running",
            "port": 9000,
            "connected_charge_points": len(connected_charge_points),
            "charge_point_ids": list(connected_charge_points.keys())
        })
    
    app.router.add_get('/status', status_handler)
    
    return app