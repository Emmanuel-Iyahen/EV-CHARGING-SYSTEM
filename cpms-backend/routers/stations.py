from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from models.database import get_db
import datetime
from models.charging import ChargingSession
from models.station import ChargingStation, ChargePoint, ChargePointStatus
from schemas.station import (
    ChargingStationResponse, 
    ChargePointResponse, 
    StationStatusUpdate
)
from services.auth import get_current_user
from models.user import User
from services.redis_service import redis_service

router = APIRouter(prefix="/stations", tags=["stations"])

@router.get("/", response_model=List[ChargingStationResponse])
def get_stations(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    stations = db.query(ChargingStation).filter(ChargingStation.is_operational == True).offset(skip).limit(limit).all()
    return stations

@router.get("/nearby", response_model=List[ChargingStationResponse])
def get_nearby_stations(
    latitude: float = Query(..., description="User latitude"),
    longitude: float = Query(..., description="User longitude"),
    radius_km: float = Query(10, description="Search radius in km"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Simplified nearby search - in production, use PostGIS or similar
    stations = db.query(ChargingStation).filter(ChargingStation.is_operational == True).all()
    return stations  # For demo, return all stations

@router.get("/{station_id}", response_model=ChargingStationResponse)
def get_station(
    station_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    station = db.query(ChargingStation).filter(ChargingStation.id == station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail="Station not found")
    return station

@router.get("/{station_id}/charge-points", response_model=List[ChargePointResponse])
def get_station_charge_points(
    station_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    charge_points = db.query(ChargePoint).filter(ChargePoint.station_id == station_id).all()
    return charge_points

@router.put("/charge-points/{charge_point_id}/status")
def update_charge_point_status(
    charge_point_id: int,
    status_update: StationStatusUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    charge_point = db.query(ChargePoint).filter(ChargePoint.id == charge_point_id).first()
    if not charge_point:
        raise HTTPException(status_code=404, detail="Charge point not found")
    
    # Update charge point status
    charge_point.status = status_update.status
    charge_point.current_power_kw = status_update.current_power_kw
    
    # Update station available connectors count
    station = db.query(ChargingStation).filter(ChargingStation.id == charge_point.station_id).first()
    if station:
        if status_update.status == ChargePointStatus.AVAILABLE:
            station.available_connectors = min(station.total_connectors, station.available_connectors + 1)
        elif status_update.status == ChargePointStatus.CHARGING and charge_point.status != ChargePointStatus.CHARGING:
            station.available_connectors = max(0, station.available_connectors - 1)
    
    # Store in Redis for real-time updates
    redis_service.set_charge_point_status(charge_point_id, {
        "status": status_update.status,
        "current_power_kw": status_update.current_power_kw,
        "station_id": charge_point.station_id,
        "connector_id": charge_point.connector_id,
        "updated_by": current_user.id
    })
    
    db.commit()
    
    return {"message": "Charge point status updated successfully"}



from datetime import datetime, timezone  # Make sure to import timezone

@router.get("/{station_id}/charge-points/detailed")
def get_station_charge_points_detailed(
    station_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get detailed charge point information including active sessions"""
    charge_points = db.query(ChargePoint).filter(ChargePoint.station_id == station_id).all()
    
    detailed_points = []
    for cp in charge_points:
        # Get active session for this charge point
        active_session = db.query(ChargingSession).filter(
            ChargingSession.charge_point_id == cp.id,
            ChargingSession.is_active == True
        ).first()
        
        session_info = None
        if active_session:
            # Get user info for the session
            user = db.query(User).filter(User.id == active_session.user_id).first()
            
            # Use timezone-aware datetime for calculation
            current_time = datetime.now(timezone.utc)
            session_info = {
                "session_id": active_session.id,
                "user_name": user.full_name if user else "Unknown User",
                "user_id": active_session.user_id,
                "start_time": active_session.start_time,
                "energy_consumed_kwh": active_session.energy_consumed_kwh,
                "current_power_kw": active_session.current_power_kw,
                "duration_minutes": int((current_time - active_session.start_time).total_seconds() / 60)
            }
        
        detailed_points.append({
            "id": cp.id,
            "connector_id": cp.connector_id,
            "status": cp.status,
            "current_power_kw": cp.current_power_kw,
            "max_power_kw": cp.max_power_kw,
            "is_operational": cp.is_operational,
            "last_heartbeat": cp.last_heartbeat,
            "active_session": session_info
        })
    
    return detailed_points

