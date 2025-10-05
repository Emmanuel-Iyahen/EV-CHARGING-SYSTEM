from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from enum import Enum

class ChargePointStatus(str, Enum):
    AVAILABLE = "available"
    CHARGING = "charging"
    UNAVAILABLE = "unavailable"
    FAULTED = "faulted"

class ChargingStationBase(BaseModel):
    name: str
    location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    total_connectors: int = 1
    power_output_kw: float = 7.4

class ChargingStationCreate(ChargingStationBase):
    pass

class ChargingStationResponse(ChargingStationBase):
    id: int
    available_connectors: int
    is_operational: bool
    created_at: datetime

    class Config:
        from_attributes = True

class ChargePointBase(BaseModel):
    station_id: int
    connector_id: int
    max_power_kw: float = 22.0

class ChargePointResponse(ChargePointBase):
    id: int
    status: ChargePointStatus
    current_power_kw: float
    is_operational: bool
    last_heartbeat: Optional[datetime]

    class Config:
        from_attributes = True

class StationStatusUpdate(BaseModel):
    status: ChargePointStatus
    current_power_kw: Optional[float] = 0.0