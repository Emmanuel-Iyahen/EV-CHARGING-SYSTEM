# # ocpp_websocket_server.py
# import asyncio
import logging
# from aiohttp import web
# from ocpp.v16 import ChargePoint as OCPPChargePoint
from ocpp_server import OCPPChargePointHandler

logger = logging.getLogger(__name__)

# async def on_connect(request, db_session=None):
#     """Handle OCPP WebSocket connection from charge points"""
#     charge_point_id = request.match_info['charge_point_id']
    
#     # Create OCPP charge point
#     ocpp_charge_point = OCPPChargePointHandler(charge_point_id, request, db_session)
    
#     try:
#         # Handle the OCPP connection
#         await ocpp_charge_point.start()
#     except Exception as e:
#         logger.error(f"Charge point {charge_point_id} disconnected: {e}")
    
#     return web.Response()

# def create_ocpp_server(db_session=None):
#     app = web.Application()
#     app.router.add_route('GET', '/ocpp/{charge_point_id}', on_connect)
#     return app




# services/ocpp_server.py (continued)
from aiohttp import web
import asyncio

async def on_connect(request, db_session=None, ocpp_service=None):
    """Handle OCPP WebSocket connection from charge points"""
    charge_point_id = request.match_info['charge_point_id']
    
    logger.info(f"New OCPP connection from charge point: {charge_point_id}")
    
    # Create OCPP charge point handler
    ocpp_charge_point = OCPPChargePointHandler(
        charge_point_id, 
        request, 
        db_session, 
        ocpp_service
    )
    
    try:
        # Handle the OCPP connection
        await ocpp_charge_point.start()
    except Exception as e:
        logger.error(f"Charge point {charge_point_id} disconnected: {e}")
    
    return web.Response()

def create_ocpp_server(db_session=None, ocpp_service=None):
    """Create OCPP WebSocket server"""
    app = web.Application()
    
    # Add OCPP route
    app.router.add_route('GET', '/ocpp/{charge_point_id}', 
                         lambda request: on_connect(request, db_session, ocpp_service))
    
    return app