# # from fastapi import FastAPI, Depends, WebSocket, WebSocketDisconnect 
# # from fastapi.middleware.cors import CORSMiddleware
# # from sqlalchemy import create_engine
# # from sqlalchemy.orm import Session
# # import asyncio
# # from contextlib import asynccontextmanager

# # from models.database import Base, engine, get_db
# # from models import user, station, charging
# # from routers import auth, users, stations, charging, admin
# # from services.websocket import websocket_manager
# # from datetime import datetime



# from fastapi import FastAPI, Depends, WebSocket, WebSocketDisconnect 
# from fastapi.middleware.cors import CORSMiddleware
# from sqlalchemy import create_engine
# from sqlalchemy.orm import Session
# import asyncio
# import threading  # Add this
# from contextlib import asynccontextmanager
# from aiohttp import web  # Add this for OCPP server

# from models.database import Base, engine, get_db
# from models import user, station, charging
# from routers import auth, users, stations, charging, admin
# from services.websocket import websocket_manager
# from datetime import datetime

# # Import your OCPP components
# from services.ocpp_server import create_ocpp_server, ocpp_service
# from services.cpp_service import OCPPService
# # Create database tables
# Base.metadata.create_all(bind=engine)



# # Add these endpoints to check OCPP connection status
# @app.get("/ocpp/status")
# async def get_ocpp_status(db: Session = Depends(get_db)):
#     """Get overall OCPP server status and connected charge points"""
#     # Get all charge points with OCPP info
#     from models.station import ChargePoint
#     charge_points = db.query(ChargePoint).all()
    
#     connected_points = []
#     for cp in charge_points:
#         is_connected = cp.ocpp_charge_point_id in ocpp_service.connected_charge_points
#         connected_points.append({
#             "id": cp.id,
#             "ocpp_charge_point_id": cp.ocpp_charge_point_id,
#             "connector_id": cp.connector_id,
#             "station_id": cp.station_id,
#             "ocpp_connected": cp.ocpp_connected,
#             "currently_connected": is_connected,
#             "last_heartbeat": cp.last_heartbeat,
#             "vendor": cp.vendor,
#             "model": cp.model
#         })
    
#     return {
#         "ocpp_server_running": True,
#         "connected_charge_points_count": len(ocpp_service.connected_charge_points),
#         "charge_points": connected_points
#     }

# @app.get("/ocpp/charge-points/{charge_point_id}/status")
# async def get_charge_point_status(charge_point_id: str, db: Session = Depends(get_db)):
#     """Get detailed status for a specific charge point"""
#     from models.station import ChargePoint
#     charge_point = db.query(ChargePoint).filter(
#         ChargePoint.ocpp_charge_point_id == charge_point_id
#     ).first()
    
#     if not charge_point:
#         return {"error": "Charge point not found"}
    
#     is_connected = charge_point_id in ocpp_service.connected_charge_points
    
#     return {
#         "ocpp_charge_point_id": charge_point_id,
#         "database_ocpp_connected": charge_point.ocpp_connected,
#         "currently_connected_to_server": is_connected,
#         "last_heartbeat": charge_point.last_heartbeat,
#         "vendor": charge_point.vendor,
#         "model": charge_point.model,
#         "status": charge_point.status,
#         "is_operational": charge_point.is_operational
#     }

# @asynccontextmanager
# async def lifespan(app: FastAPI):
#     # Startup
#     await websocket_manager.connect_redis()
#     asyncio.create_task(websocket_manager.listen_redis_channel("charging_updates"))
#     asyncio.create_task(websocket_manager.listen_redis_channel("charge_point_updates"))
    
#     # Start OCPP server
#     asyncio.create_task(start_ocpp_server())
    
#     yield
#     # Shutdown
#     pass
# # async def lifespan(app: FastAPI):
# #     # Startup
# #     await websocket_manager.connect_redis()
# #     asyncio.create_task(websocket_manager.listen_redis_channel("charging_updates"))
# #     asyncio.create_task(websocket_manager.listen_redis_channel("charge_point_updates"))
# #     yield
# #     # Shutdown
# #     pass

# app = FastAPI(
#     title="EV Charging System",
#     description="A comprehensive EV charging management system",
#     version="1.0.0",
#     lifespan=lifespan
# )

# # CORS middleware
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )
    



# # Include routers
# app.include_router(auth.router)
# app.include_router(users.router)
# app.include_router(stations.router)
# app.include_router(charging.router)
# app.include_router(admin.router)




# async def start_ocpp_server():
#     """Start OCPP WebSocket server in background"""
#     app = create_ocpp_server()
#     runner = web.AppRunner(app)
#     await runner.setup()
#     site = web.TCPSite(runner, '0.0.0.0', 9000)
#     await site.start()
#     print("OCPP server running on port 9000")



# @app.get("/")
# def root():
#     return {"message": "EV Charging System API", "version": "1.0.0"}

# @app.get("/health")
# def health_check():
#     return {"status": "healthy"}

# if __name__ == "__main__":
#     import uvicorn
#     # Start OCPP server in background thread
#     def run_ocpp_server():
#         asyncio.run(start_ocpp_server())

#     ocpp_thread = threading.Thread(target=run_ocpp_server, daemon=True)
#     ocpp_thread.start()

#     uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)






# # main.py
# from fastapi import FastAPI, Depends
# from fastapi.middleware.cors import CORSMiddleware
# from sqlalchemy.orm import Session
# import asyncio
# from contextlib import asynccontextmanager
# from aiohttp import web

# from models.database import Base, engine, get_db
# from routers import auth, users, stations, charging, admin
# from services.websocket import websocket_manager
# from services.cpp_service import ocpp_service

# # Import OCPP server function
# async def create_ocpp_server():
#     """Create and return OCPP server"""
#     from services.ocpp_server import create_ocpp_server
#     from models.database import SessionLocal
    
#     db_session = SessionLocal()
#     return create_ocpp_server(db_session=db_session, ocpp_service=ocpp_service)

# async def start_ocpp_server():
#     """Start OCPP WebSocket server in background"""
#     try:
#         app = await create_ocpp_server()
#         runner = web.AppRunner(app)
#         await runner.setup()
#         site = web.TCPSite(runner, '0.0.0.0', 9000)
#         await site.start()
#         print("✅ OCPP server running on port 9000")
        
#         # Keep the server running
#         await asyncio.Future()
#     except Exception as e:
#         print(f"❌ Failed to start OCPP server: {e}")

# @asynccontextmanager
# async def lifespan(app: FastAPI):
#     # Startup
#     await websocket_manager.connect_redis()
#     asyncio.create_task(websocket_manager.listen_redis_channel("charging_updates"))
#     asyncio.create_task(websocket_manager.listen_redis_channel("charge_point_updates"))
    
#     # Start OCPP server in background
#     asyncio.create_task(start_ocpp_server())
    
#     yield
#     # Shutdown
#     pass

# app = FastAPI(
#     title="EV Charging System",
#     description="A comprehensive EV charging management system",
#     version="1.0.0",
#     lifespan=lifespan
# )

# # CORS middleware
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # Include routers
# app.include_router(auth.router)
# app.include_router(users.router)
# app.include_router(stations.router)
# app.include_router(charging.router)
# app.include_router(admin.router)

# # OCPP status endpoint
# @app.get("/ocpp/status")
# async def get_ocpp_status():
#     """Get OCPP server status"""
#     return {
#         "ocpp_server_running": True,
#         "port": 9000,
#         "connected_charge_points": len(ocpp_service.connected_charge_points),
#         "connected_ids": list(ocpp_service.connected_charge_points.keys())
#     }

# @app.get("/")
# def root():
#     return {"message": "EV Charging System API", "version": "1.0.0"}

# @app.get("/health")
# def health_check():
#     return {"status": "healthy"}

# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)





# # main.py
# from fastapi import FastAPI
# from fastapi.middleware.cors import CORSMiddleware
# import asyncio
# from contextlib import asynccontextmanager
# from aiohttp import web
# import logging

# # Configure logging
# logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
# logger = logging.getLogger(__name__)

# from services.websocket import websocket_manager

# async def start_ocpp_server():
#     """Start OCPP WebSocket server in background"""
#     try:
#         from services.ocpp_server import create_ocpp_server
        
#         logger.info("🚀 Starting OCPP server on port 9000...")
#         app = create_ocpp_server()
#         runner = web.AppRunner(app)
#         await runner.setup()
#         site = web.TCPSite(runner, '0.0.0.0', 9000)
#         await site.start()
        
#         logger.info("✅ OCPP server successfully running on port 9000")
        
#         # You can check the status at http://localhost:9000/status
        
#         # Keep the server running
#         await asyncio.Future()
        
#     except Exception as e:
#         logger.error(f"❌ Failed to start OCPP server: {e}")
#         import traceback
#         logger.error(traceback.format_exc())

# @asynccontextmanager
# async def lifespan(app: FastAPI):
#     # Startup
#     try:
#         await websocket_manager.connect_redis()
#         asyncio.create_task(websocket_manager.listen_redis_channel("charging_updates"))
#         asyncio.create_task(websocket_manager.listen_redis_channel("charge_point_updates"))
#         logger.info("✅ WebSocket manager started")
#     except Exception as e:
#         logger.error(f"❌ WebSocket manager failed: {e}")
    
#     # Start OCPP server in background
#     asyncio.create_task(start_ocpp_server())
    
#     yield
#     # Shutdown
#     logger.info("Shutting down...")

# app = FastAPI(
#     title="EV Charging System",
#     description="A comprehensive EV charging management system",
#     version="1.0.0",
#     lifespan=lifespan
# )

# # CORS middleware
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # Import and include routers
# try:
#     from routers import auth, users, stations, charging, admin
#     app.include_router(auth.router)
#     app.include_router(users.router)
#     app.include_router(stations.router)
#     app.include_router(charging.router)
#     app.include_router(admin.router)
#     logger.info("✅ All routers loaded")
# except Exception as e:
#     logger.error(f"❌ Router loading failed: {e}")

# # OCPP status endpoint (for the main API)
# @app.get("/ocpp/status")
# async def get_ocpp_status():
#     """Get OCPP server status"""
#     try:
#         from services.ocpp_server import connected_charge_points
#         return {
#             "status": "running",
#             "ocpp_port": 9000,
#             "connected_charge_points": len(connected_charge_points),
#             "charge_point_ids": list(connected_charge_points.keys()),
#             "message": "OCPP server is running on port 9000"
#         }
#     except Exception as e:
#         return {
#             "status": "error",
#             "error": str(e)
#         }

# @app.get("/")
# def root():
#     return {"message": "EV Charging System API", "version": "1.0.0"}

# @app.get("/health")
# def health_check():
#     return {"status": "healthy", "ocpp_enabled": True}

# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)





# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import asyncio
from models.database import engine, get_db, Base
import models
from contextlib import asynccontextmanager
from aiohttp import web
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

from services.websocket import websocket_manager






async def start_ocpp_server():
    """Start OCPP WebSocket server in background"""
    try:
        from services.ocpp_server_minimal import create_ocpp_server
        
        logger.info("🚀 Starting Minimal OCPP server on port 9000...")
        app = create_ocpp_server()
        runner = web.AppRunner(app)
        await runner.setup()
        site = web.TCPSite(runner, '0.0.0.0', 9000)
        await site.start()
        
        logger.info("✅ Minimal OCPP server successfully running on port 9000")
        logger.info("   - WebSocket endpoint: ws://localhost:9000/ocpp/{charge_point_id}")
        logger.info("   - Status endpoint: http://localhost:9000/status")
        
        # Keep the server running
        await asyncio.Future()
        
    except Exception as e:
        logger.error(f"❌ Failed to start OCPP server: {e}")
        import traceback
        logger.error(traceback.format_exc())

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    try:
        await websocket_manager.connect_redis()
        asyncio.create_task(websocket_manager.listen_redis_channel("charging_updates"))
        asyncio.create_task(websocket_manager.listen_redis_channel("charge_point_updates"))
        logger.info("✅ WebSocket manager started")
    except Exception as e:
        logger.error(f"❌ WebSocket manager failed: {e}")
    
    # Start OCPP server in background
    asyncio.create_task(start_ocpp_server())
    
    yield
    # Shutdown
    logger.info("Shutting down...")

app = FastAPI(
    title="EV Charging System",
    description="A comprehensive EV charging management system",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import and include routers
try:
    from routers import auth, users, stations, charging, admin
    app.include_router(auth.router)
    app.include_router(users.router)
    app.include_router(stations.router)
    app.include_router(charging.router)
    app.include_router(admin.router)
    logger.info("✅ All routers loaded")
except Exception as e:
    logger.error(f"❌ Router loading failed: {e}")

# OCPP status endpoint (for the main API)
@app.get("/ocpp/status")
async def get_ocpp_status():
    """Get OCPP server status"""
    try:
        from services.ocpp_server_minimal import connected_charge_points
        return {
            "status": "running",
            "ocpp_port": 9001,
            "server_type": "minimal_ocpp_1.6",
            "connected_charge_points": len(connected_charge_points),
            "charge_point_ids": list(connected_charge_points.keys()),
            "message": "Minimal OCPP 1.6 server is running"
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }

@app.get("/")
def root():
    return {"message": "EV Charging System API", "version": "1.0.0"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "ocpp_enabled": True}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)