from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from datetime import datetime
import json
import asyncio
import logging
from services import ocpp_service
from models.user import User
from typing import List
from models.database import get_db
from models.charging import ChargingSession
from models.station import ChargePoint, ChargePointStatus, ChargingStation
from schemas.charging import ChargingSessionCreate, ChargingSessionResponse, ChargingSessionUpdate, ChargingStop
from services.auth import get_current_user
from services.redis_service import redis_service
from services.websocket import websocket_manager

logger = logging.getLogger(__name__)


router = APIRouter(prefix="/charging", tags=["charging"])

@router.post("/start", response_model=ChargingSessionResponse)
def start_charging(
    charging_data: ChargingSessionCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Check if charge point exists and is available
    charge_point = db.query(ChargePoint).filter(ChargePoint.id == charging_data.charge_point_id).first()
    if not charge_point:
        raise HTTPException(status_code=404, detail="Charge point not found")
    
    if charge_point.status != ChargePointStatus.AVAILABLE:
        raise HTTPException(status_code=400, detail="Charge point is not available")
    
    if not charge_point.is_operational:
        raise HTTPException(status_code=400, detail="Charge point is not operational")
    

        # Check OCPP connection
    if charge_point.ocpp_charge_point_id and not charge_point.ocpp_connected:
        raise HTTPException(status_code=400, detail="Charge point is not connected")
    
    
    # Check if user has an active session
    active_session = db.query(ChargingSession).filter(
        ChargingSession.user_id == current_user.id,
        ChargingSession.is_active == True
    ).first()
    
    if active_session:
        raise HTTPException(status_code=400, detail="User already has an active charging session")
    
    # Create charging session
    session = ChargingSession(
        user_id=current_user.id,
        charge_point_id=charging_data.charge_point_id,
        station_id=charge_point.station_id,
        is_active=True
    )
    
    # Update charge point status
    charge_point.status = ChargePointStatus.CHARGING
    
    # Update station available connectors
    station_charge_points = db.query(ChargePoint).filter(ChargePoint.station_id == charge_point.station_id).all()
    available_count = sum(1 for cp in station_charge_points if cp.status == ChargePointStatus.AVAILABLE and cp.is_operational)
    
    # FIX: Query ChargingStation table instead of ChargingSession
    station = db.query(ChargingStation).filter(ChargingStation.id == charge_point.station_id).first()
    if station:
        station.available_connectors = available_count
    
    db.add(session)
    db.commit()
    db.refresh(session)

    # Send OCPP Remote Start Transaction if charge point supports OCPP
    ocpp_success = True
    if charge_point.ocpp_charge_point_id and charge_point.ocpp_connected:
        try:
            ocpp_success = ocpp_service.remote_start_transaction(
                charge_point.ocpp_charge_point_id,
                charge_point.connector_id,
                str(current_user.id)  # or use current_user.ocpp_id_tag if you have it
            )
            
            if not ocpp_success:
                logger.warning(f"OCPP remote start failed, but session created in database")
                
        except Exception as e:
            logger.error(f"OCPP remote start error: {e}")
            ocpp_success = False
    
    # Store session in Redis for real-time monitoring
    redis_service.set_charging_session(session.id, {
        "session_id": session.id,
        "user_id": current_user.id,
        "user_name": current_user.full_name,
        "charge_point_id": charge_point.id,
        "station_id": charge_point.station_id,
        "start_time": session.start_time.isoformat(),
        "current_power_kw": 0.0,
        "energy_consumed_kwh": 0.0,
        "is_active": True
    })

    print('added to redis')
    
    # Update charge point status in Redis
    redis_service.set_charge_point_status(charge_point.id, {
        "status": ChargePointStatus.CHARGING,
        "current_power_kw": 0.0,
        "session_id": session.id,
        "user_id": current_user.id,
        "user_name": current_user.full_name
    })
    
    # Notify WebSocket clients
    redis_service.publish_websocket_message("charging_updates", {
        "type": "session_started",
        "session_id": session.id,
        "charge_point_id": charge_point.id,
        "station_id": charge_point.station_id,
        "user_id": current_user.id,
        "user_name": current_user.full_name,
        "start_time": session.start_time.isoformat()
    })
    
    return session



async def send_remote_start_transaction(charge_point_id, connector_id, transaction_id, id_tag):
    """Send OCPP RemoteStartTransaction to physical charger"""
    # This would send the command via your OCPP server
    # Implementation depends on how you manage connected charge points
    pass


@router.post("/stop", response_model=ChargingSessionResponse)
def stop_charging(
    stop_data: ChargingStop,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Get charging session
    session = db.query(ChargingSession).filter(ChargingSession.id == stop_data.session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Charging session not found")
    
    if session.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized to stop this session")
    
    if not session.is_active:
        raise HTTPException(status_code=400, detail="Charging session is already stopped")
    
    # Update session
    session.is_active = False
    session.end_time = datetime.utcnow()
    
    # Update charge point status
    charge_point = db.query(ChargePoint).filter(ChargePoint.id == session.charge_point_id).first()
    if charge_point:
        charge_point.status = ChargePointStatus.AVAILABLE
        charge_point.current_power_kw = 0.0
        
        # Update station available connectors
        station_charge_points = db.query(ChargePoint).filter(ChargePoint.station_id == charge_point.station_id).all()
        available_count = sum(1 for cp in station_charge_points if cp.status == ChargePointStatus.AVAILABLE and cp.is_operational)
        
        # FIX: Query ChargingStation table instead of ChargingSession
        station = db.query(ChargingStation).filter(ChargingStation.id == charge_point.station_id).first()
        if station:
            station.available_connectors = available_count
    
    db.commit()
    db.refresh(session)
    
    # Remove from Redis
    redis_service.delete_charging_session(session.id)
    
    # Update charge point status in Redis
    if charge_point:
        redis_service.set_charge_point_status(charge_point.id, {
            "status": ChargePointStatus.AVAILABLE,
            "current_power_kw": 0.0
        })
    
    # Notify WebSocket clients
    redis_service.publish_websocket_message("charging_updates", {
        "type": "session_stopped",
        "session_id": session.id,
        "charge_point_id": session.charge_point_id,
        "station_id": session.station_id,
        "user_id": current_user.id,
        "user_name": current_user.full_name,
        "end_time": session.end_time.isoformat(),
        "energy_consumed_kwh": session.energy_consumed_kwh
    })
    
    return session

@router.put("/sessions/{session_id}/update")
def update_charging_session(
    session_id: int,
    update_data: ChargingSessionUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    session = db.query(ChargingSession).filter(ChargingSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Charging session not found")
    
    if session.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized to update this session")
    
    # Update session data
    session.energy_consumed_kwh = update_data.energy_consumed_kwh
    session.current_power_kw = update_data.current_power_kw
    
    # Update charge point current power
    charge_point = db.query(ChargePoint).filter(ChargePoint.id == session.charge_point_id).first()
    if charge_point:
        charge_point.current_power_kw = update_data.current_power_kw
    
    db.commit()
    
    # Update Redis
    redis_service.set_charging_session(session.id, {
        "session_id": session.id,
        "user_id": session.user_id,
        "charge_point_id": session.charge_point_id,
        "station_id": session.station_id,
        "start_time": session.start_time.isoformat(),
        "current_power_kw": session.current_power_kw,
        "energy_consumed_kwh": session.energy_consumed_kwh,
        "is_active": session.is_active
    })
    
    if charge_point:
        redis_service.set_charge_point_status(charge_point.id, {
            "status": ChargePointStatus.CHARGING,
            "current_power_kw": session.current_power_kw,
            "session_id": session.id
        })
    
    # Notify WebSocket clients
    redis_service.publish_websocket_message("charging_updates", {
        "type": "session_updated",
        "session_id": session.id,
        "charge_point_id": session.charge_point_id,
        "current_power_kw": session.current_power_kw,
        "energy_consumed_kwh": session.energy_consumed_kwh
    })
    
    return {"message": "Charging session updated successfully"}

@router.get("/sessions/active", response_model=List[ChargingSessionResponse])
def get_active_sessions(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    if current_user.is_admin:
        sessions = db.query(ChargingSession).filter(ChargingSession.is_active == True).all()
    else:
        sessions = db.query(ChargingSession).filter(
            ChargingSession.user_id == current_user.id,
            ChargingSession.is_active == True
        ).all()
    
    return sessions



@router.get("/charging-sessions/history")
async def get_charging_session_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sessions = db.query(ChargingSession).filter(
        ChargingSession.user_id == current_user.id
    ).order_by(ChargingSession.end_time.desc()).all()
    
    return [
        {
            "id": session.id,
            "station_id": session.station_id,
            "charge_point_id": session.charge_point_id,
            "start_time": session.start_time.isoformat(),
            "end_time": session.end_time.isoformat() if session.end_time else None,
            "energy_consumed_kwh": session.energy_consumed_kwh,
            "current_power_kw": session.current_power_kw,
            "is_active": session.is_active
        }
        for session in sessions
    ]


@router.websocket("/ws/charging-updates")
async def charging_updates_websocket(websocket: WebSocket):
    # Accept connection first
    await websocket.accept()
    print('✅ WebSocket connection accepted in endpoint')
    
    # Then connect to WebSocketManager (without calling accept again)
    await websocket_manager.connect(websocket, "charging_updates", "charging_updates")
    
    try:
        # Keep connection alive
        while True:
            data = await websocket.receive_text()
            print(f"📨 Received from client: {data}")
            
            try:
                message_data = json.loads(data)
                
                if message_data.get('type') == 'heartbeat':
                    print('💓 Heartbeat received from client')
                    await websocket.send_text(json.dumps({
                        "type": "heartbeat_ack",
                        "timestamp": datetime.now().isoformat()
                    }))
                elif message_data.get('type') == 'client_connected':
                    print('🔌 Client connection confirmed')
                    # WebSocketManager already sent welcome message
                else:
                    await websocket.send_text(json.dumps({
                        "type": "echo", 
                        "received": data,
                        "timestamp": datetime.now().isoformat()
                    }))
                    
            except json.JSONDecodeError:
                await websocket.send_text(json.dumps({
                    "type": "echo", 
                    "received": data,
                    "timestamp": datetime.now().isoformat()
                }))
            
    except WebSocketDisconnect:
        print("❌ Client disconnected")
        websocket_manager.disconnect(websocket, "charging_updates")
    except Exception as e:
        print(f"💥 WebSocket error: {e}")
        websocket_manager.disconnect(websocket, "charging_updates")