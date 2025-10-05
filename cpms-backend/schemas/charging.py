from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ChargingSessionBase(BaseModel):
    charge_point_id: int

class ChargingSessionCreate(ChargingSessionBase):
    pass

class ChargingSessionResponse(BaseModel):
    id: int
    user_id: int
    charge_point_id: int
    station_id: int
    start_time: datetime
    end_time: Optional[datetime]
    energy_consumed_kwh: float
    current_power_kw: float
    is_active: bool

    class Config:
        from_attributes = True

class ChargingSessionUpdate(BaseModel):
    energy_consumed_kwh: float
    current_power_kw: float

class ChargingStop(BaseModel):
    session_id: int