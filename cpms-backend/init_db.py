from sqlalchemy import create_engine
from models.database import Base
from models.user import User
from models.station import ChargingStation, ChargePoint
from utils.security import get_password_hash

from dotenv import load_dotenv
load_dotenv()
import os

DATABASE_URL = os.getenv("DATABASE_URL")

def init_database():
    engine = create_engine(DATABASE_URL)
    Base.metadata.create_all(bind=engine)
    
    from sqlalchemy.orm import sessionmaker
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    # Create admin user
    admin_user = User(
        email="admin@evcharging.com",
        hashed_password=get_password_hash("admin123"),
        full_name="System Administrator",
        is_admin=True
    )
    
    # Create sample stations
    station1 = ChargingStation(
        name="Downtown Charging Hub",
        location="123 Main Street, Downtown",
        latitude=40.7128,
        longitude=-74.0060,
        total_connectors=4,
        available_connectors=4,
        power_output_kw=22.0
    )
    
    station2 = ChargingStation(
        name="Shopping Mall Chargers",
        location="456 Oak Avenue, Shopping District",
        latitude=40.7589,
        longitude=-73.9851,
        total_connectors=2,
        available_connectors=2,
        power_output_kw=7.4
    )
    
    try:
        db.add(admin_user)
        db.add(station1)
        db.add(station2)
        db.commit()
        
        # Create charge points for station1
        for i in range(1, 5):
            charge_point = ChargePoint(
                station_id=station1.id,
                connector_id=i,
                max_power_kw=22.0
            )
            db.add(charge_point)
        
        # Create charge points for station2
        for i in range(1, 3):
            charge_point = ChargePoint(
                station_id=station2.id,
                connector_id=i,
                max_power_kw=7.4
            )
            db.add(charge_point)
        
        db.commit()
        print("Database initialized successfully!")
        
    except Exception as e:
        db.rollback()
        print(f"Error initializing database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    init_database()