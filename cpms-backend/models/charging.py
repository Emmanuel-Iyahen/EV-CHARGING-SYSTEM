from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .database import Base

class ChargingSession(Base):
    __tablename__ = "charging_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    charge_point_id = Column(Integer, nullable=False)
    station_id = Column(Integer, nullable=False)
    
    start_time = Column(DateTime(timezone=True), server_default=func.now())
    end_time = Column(DateTime(timezone=True))
    energy_consumed_kwh = Column(Float, default=0.0)
    current_power_kw = Column(Float, default=0.0)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    user = relationship("User")