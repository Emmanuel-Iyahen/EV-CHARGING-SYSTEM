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

