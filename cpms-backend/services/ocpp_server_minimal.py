# services/ocpp_server_minimal.py
import asyncio
import logging
import json
from aiohttp import web
from datetime import datetime

logger = logging.getLogger(__name__)

# Store connected charge points
connected_charge_points = {}

async def handle_ocpp_message(websocket, charge_point_id, message):
    """Handle incoming OCPP messages"""
    try:
        data = json.loads(message)
        message_type = data[0]
        message_id = data[1]
        action = data[2]
        payload = data[3] if len(data) > 3 else {}
        
        logger.info(f"📨 Received {action} from {charge_point_id}")
        
        # Handle different OCPP actions
        if action == "BootNotification":
            response = [
                3,  # MessageType.CALLRESULT
                message_id,
                {
                    "status": "Accepted",
                    "currentTime": datetime.utcnow().isoformat() + "Z",
                    "interval": 300
                }
            ]
            await websocket.send_str(json.dumps(response))
            logger.info(f"✅ BootNotification accepted for {charge_point_id}")
            
        elif action == "Heartbeat":
            response = [
                3,  # MessageType.CALLRESULT
                message_id,
                {
                    "currentTime": datetime.utcnow().isoformat() + "Z"
                }
            ]
            await websocket.send_str(json.dumps(response))
            logger.debug(f"💓 Heartbeat processed for {charge_point_id}")
            
        elif action == "StatusNotification":
            response = [
                3,  # MessageType.CALLRESULT
                message_id,
                {}
            ]
            await websocket.send_str(json.dumps(response))
            logger.info(f"📊 StatusNotification processed for {charge_point_id}: {payload.get('status', 'unknown')}")
            
        elif action == "Authorize":
            response = [
                3,  # MessageType.CALLRESULT
                message_id,
                {
                    "idTagInfo": {"status": "Accepted"}
                }
            ]
            await websocket.send_str(json.dumps(response))
            logger.info(f"🔑 Authorize processed for {charge_point_id}")
            
        elif action == "StartTransaction":
            transaction_id = int(datetime.utcnow().timestamp())
            response = [
                3,  # MessageType.CALLRESULT
                message_id,
                {
                    "transactionId": transaction_id,
                    "idTagInfo": {"status": "Accepted"}
                }
            ]
            await websocket.send_str(json.dumps(response))
            logger.info(f"⚡ StartTransaction processed for {charge_point_id}, transaction: {transaction_id}")
            
        elif action == "StopTransaction":
            response = [
                3,  # MessageType.CALLRESULT
                message_id,
                {
                    "idTagInfo": {"status": "Accepted"}
                }
            ]
            await websocket.send_str(json.dumps(response))
            logger.info(f"🛑 StopTransaction processed for {charge_point_id}")
            
        elif action == "MeterValues":
            response = [
                3,  # MessageType.CALLRESULT
                message_id,
                {}
            ]
            await websocket.send_str(json.dumps(response))
            logger.debug(f"📈 MeterValues processed for {charge_point_id}")
            
        else:
            logger.warning(f"❓ Unknown OCPP action: {action} from {charge_point_id}")
            # Send empty response for unknown actions
            response = [3, message_id, {}]
            await websocket.send_str(json.dumps(response))
            
    except Exception as e:
        logger.error(f"❌ Error processing OCPP message from {charge_point_id}: {e}")

async def ocpp_websocket_handler(request):
    """Handle OCPP WebSocket connection from charge points"""
    charge_point_id = request.match_info['charge_point_id']
    
    logger.info(f"🔌 New OCPP connection from: {charge_point_id}")
    
    # Create WebSocket response
    ws = web.WebSocketResponse()
    await ws.prepare(request)
    
    # Store the connection
    connected_charge_points[charge_point_id] = ws
    logger.info(f"✅ Charge point {charge_point_id} connected. Total: {len(connected_charge_points)}")
    
    try:
        async for msg in ws:
            if msg.type == web.WSMsgType.TEXT:
                await handle_ocpp_message(ws, charge_point_id, msg.data)
            elif msg.type == web.WSMsgType.ERROR:
                logger.error(f"WebSocket error with {charge_point_id}: {ws.exception()}")
                
    except Exception as e:
        logger.error(f"❌ Error with charge point {charge_point_id}: {e}")
    finally:
        # Remove from connected points
        if charge_point_id in connected_charge_points:
            del connected_charge_points[charge_point_id]
            logger.info(f"📴 Charge point {charge_point_id} disconnected. Total: {len(connected_charge_points)}")
    
    return ws

def create_ocpp_server():
    """Create OCPP WebSocket server"""
    app = web.Application()
    
    # Add OCPP WebSocket route
    app.router.add_get('/ocpp/{charge_point_id}', ocpp_websocket_handler)
    
    # Add status endpoint
    async def status_handler(request):
        return web.json_response({
            "status": "running",
            "port": 9000,
            "protocol": "OCPP 1.6",
            "connected_charge_points": len(connected_charge_points),
            "charge_point_ids": list(connected_charge_points.keys()),
            "server": "Minimal OCPP Server"
        })
    
    app.router.add_get('/status', status_handler)
    
    # Add root endpoint
    async def root_handler(request):
        return web.json_response({
            "message": "OCPP 1.6 Server",
            "endpoints": {
                "websocket": "/ocpp/{charge_point_id}",
                "status": "/status"
            }
        })
    
    app.router.add_get('/', root_handler)
    
    return app