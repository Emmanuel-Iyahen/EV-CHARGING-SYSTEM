from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Enum as SQLEnum
from sqlalchemy.sql import func
from enum import Enum
from .database import Base

class ChargePointStatus(str, Enum):
    AVAILABLE = "available"
    CHARGING = "charging"
    UNAVAILABLE = "unavailable"
    FAULTED = "faulted"

class ChargingStation(Base):
    __tablename__ = "charging_stations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    location = Column(String, nullable=False)
    latitude = Column(Float)
    longitude = Column(Float)
    total_connectors = Column(Integer, default=1)
    available_connectors = Column(Integer, default=1)
    power_output_kw = Column(Float, default=7.4)  # kW
    is_operational = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class ChargePoint(Base):
    __tablename__ = "charge_points"

    id = Column(Integer, primary_key=True, index=True)
    station_id = Column(Integer, nullable=False)
    connector_id = Column(Integer, nullable=False)  # 1, 2, 3, etc.
    status = Column(SQLEnum(ChargePointStatus), default=ChargePointStatus.AVAILABLE)
    current_power_kw = Column(Float, default=0.0)
    max_power_kw = Column(Float, default=22.0)  # Type 2 AC charging
    is_operational = Column(Boolean, default=True)
    last_heartbeat = Column(DateTime(timezone=True))

    # OCPP-specific fields
    ocpp_charge_point_id = Column(String(255), unique=True, nullable=True)  # OCPP ChargeBox ID
    ocpp_version = Column(String(10), default="1.6")  # 1.6 or 2.0.1
    ocpp_connected = Column(Boolean, default=False)
    vendor = Column(String(100), nullable=True)
    model = Column(String(100), nullable=True)
    serial_number = Column(String(100), nullable=True)