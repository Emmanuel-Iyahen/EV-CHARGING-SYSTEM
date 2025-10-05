from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from models.database import get_db
from models.user import User
from models.station import ChargingStation, ChargePoint
from models.charging import ChargingSession
from schemas.station import ChargingStationCreate, ChargePointBase
from schemas.user import UserResponse
from services.auth import get_current_admin_user

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/dashboard")
def get_admin_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    # Get statistics
    total_stations = db.query(ChargingStation).count()
    total_charge_points = db.query(ChargePoint).count()
    total_users = db.query(User).count()
    active_sessions = db.query(ChargingSession).filter(ChargingSession.is_active == True).count()
    
    # Get station status summary
    stations = db.query(ChargingStation).all()
    station_status = []
    
    for station in stations:
        charge_points = db.query(ChargePoint).filter(ChargePoint.station_id == station.id).all()
        available = sum(1 for cp in charge_points if cp.status == "available")
        charging = sum(1 for cp in charge_points if cp.status == "charging")
        unavailable = sum(1 for cp in charge_points if cp.status == "unavailable")
        
        station_status.append({
            "station_id": station.id,
            "station_name": station.name,
            "available": available,
            "charging": charging,
            "unavailable": unavailable,
            "total": len(charge_points)
        })
    
    return {
        "statistics": {
            "total_stations": total_stations,
            "total_charge_points": total_charge_points,
            "total_users": total_users,
            "active_sessions": active_sessions
        },
        "station_status": station_status
    }

@router.post("/stations", response_model=ChargingStationCreate)
def create_station(
    station_data: ChargingStationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    station = ChargingStation(
        name=station_data.name,
        location=station_data.location,
        latitude=station_data.latitude,
        longitude=station_data.longitude,
        total_connectors=station_data.total_connectors,
        available_connectors=station_data.total_connectors,
        power_output_kw=station_data.power_output_kw
    )
    
    db.add(station)
    db.commit()
    db.refresh(station)
    
    # Create charge points for the station
    for connector_id in range(1, station_data.total_connectors + 1):
        charge_point = ChargePoint(
            station_id=station.id,
            connector_id=connector_id,
            max_power_kw=station_data.power_output_kw
        )
        db.add(charge_point)
    
    db.commit()
    
    return station

@router.post("/stations/{station_id}/charge-points")
def add_charge_point(
    station_id: int,
    charge_point_data: ChargePointBase,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    station = db.query(ChargingStation).filter(ChargingStation.id == station_id).first()
    if not station:
        raise HTTPException(status_code=404, detail="Station not found")
    
    # Check if connector ID already exists
    existing = db.query(ChargePoint).filter(
        ChargePoint.station_id == station_id,
        ChargePoint.connector_id == charge_point_data.connector_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Connector ID already exists for this station")
    
    charge_point = ChargePoint(
        station_id=station_id,
        connector_id=charge_point_data.connector_id,
        max_power_kw=charge_point_data.max_power_kw
    )
    
    # Update station connector count
    station.total_connectors += 1
    station.available_connectors += 1
    
    db.add(charge_point)
    db.commit()
    db.refresh(charge_point)
    
    return charge_point

@router.get("/users", response_model=List[UserResponse])
def get_all_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    users = db.query(User).offset(skip).limit(limit).all()
    return users

@router.get("/charging-sessions")
def get_all_charging_sessions(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    sessions = db.query(ChargingSession).offset(skip).limit(limit).all()
    return sessions