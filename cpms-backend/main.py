
# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import asyncio
from models.database import engine, get_db, Base
import models
from contextlib import asynccontextmanager
from aiohttp import web
import logging

from init_db import init_database

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

from services.websocket import websocket_manager




# async def create_tables():
#     async with engine.begin() as conn:
#         # This will create all tables defined in Base subclasses (User, etc.)
#         await conn.run_sync(Base.metadata.create_all)
#     print("Tables created successfully!")



def create_tables():
    try:
        with engine.begin() as conn:
            Base.metadata.create_all(bind=conn)
        logger.info("✅ Database tables created/verified (sync)")
    except Exception as e:
        logger.error(f"❌ Sync table creation failed: {e}")
        raise




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
        create_tables()
        logger.info("✅ Database tables created / verified")
        init_database() 
    except Exception as e:
        logger.error(f"❌ Database table creation failed: {e}")

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
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://customer-app.smartprojects.dev", "https://cpms-admin.smartprojects.dev",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
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

    # app.include_router(auth.router, prefix="/auth", tags=["Auth"])
    # app.include_router(users.router, prefix="/users", tags=["Users"])
    # app.include_router(stations.router, prefix="/stations", tags=["Stations"])
    # app.include_router(charging.router, prefix="/charging", tags=["Charging"])
    # app.include_router(admin.router, prefix="/admin", tags=["Admin"])
    # logger.info("✅ All routers loaded")
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