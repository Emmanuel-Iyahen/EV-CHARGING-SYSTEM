# models/__init__.py


# Import all your model modules
# Add all your other model files
import logging
# You can also import specific models if needed
from .user import User
from .charging import ChargingSession
from .station import ChargePoint, ChargePointStatus

logger = logging.getLogger(__name__)


import os

def create_database_tables():
    """Create database tables with environment awareness"""
    try:
        environment = os.getenv("ENVIRONMENT", "development")
        
        if environment in ["development", "test", "staging"]:
            from models import Base, engine
            
            logger.info(f"🔄 Creating database tables in {environment} environment...")
            Base.metadata.create_all(bind=engine)
            
            # Verify tables
            from sqlalchemy import inspect
            inspector = inspect(engine)
            tables = inspector.get_table_names()
            
            logger.info(f"✅ Successfully created {len(tables)} tables: {tables}")
            
            # Add sample data for development
            if environment == "development":
                # add_sample_data()
                pass
                
            return True
        else:
            logger.info(f"⚠️  Running in {environment} - tables not auto-created")
            logger.info("💡 Use database migrations for production")
            return True
            
    except Exception as e:
        logger.error(f"❌ Failed to create database tables: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return False

# def add_sample_data():
#     """Add sample data for development environment"""
#     try:
#         from models.database import SessionLocal
#         from models.charging_station import ChargingStation
#         from models.connector import Connector
        
#         db = SessionLocal()
        
#         # Check if we already have stations
#         if db.query(ChargingStation).count() == 0:
#             logger.info("📊 Adding sample charging stations...")
            
#             # Add sample stations
#             station1 = ChargingStation(
#                 name="Downtown Charging Hub",
#                 location="123 Main Street",
#                 vendor="ABB",
#                 model="Terra 54",
#                 serial_number="ABB-001",
#                 firmware_version="1.2.3",
#                 ip_address="192.168.1.100"
#             )
#             db.add(station1)
#             db.flush()  # Get the ID
            
#             # Add connectors for station1
#             connector1 = Connector(
#                 station_id=station1.id,
#                 connector_id=1,
#                 type="CCS",
#                 status="Available",
#                 max_power=50.0
#             )
#             connector2 = Connector(
#                 station_id=station1.id,
#                 connector_id=2, 
#                 type="Type2",
#                 status="Available",
#                 max_power=22.0
#             )
#             db.add_all([connector1, connector2])
            
#             station2 = ChargingStation(
#                 name="Mall Charging Point",
#                 location="456 Shopping Ave", 
#                 vendor="Siemens",
#                 model="SICHARGE",
#                 serial_number="SIEMENS-001",
#                 firmware_version="2.0.1",
#                 ip_address="192.168.1.101"
#             )
#             db.add(station2)
#             db.flush()
            
#             connector3 = Connector(
#                 station_id=station2.id,
#                 connector_id=1,
#                 type="CHAdeMO",
#                 status="Available", 
#                 max_power=50.0
#             )
#             db.add(connector3)
            
#             db.commit()
#             logger.info("✅ Sample data added successfully!")
            
#         db.close()
        
#     except Exception as e:
#         logger.error(f"❌ Error adding sample data: {e}")
#         db.rollback()