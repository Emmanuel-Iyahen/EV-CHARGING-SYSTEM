from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
load_dotenv()
import os



DATABASE_URL = os.getenv("DATABASE_URL")



engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()




# from sqlalchemy.ext.asyncio import (
#     create_async_engine,
#     AsyncSession,
# )
# from sqlalchemy.orm import sessionmaker, declarative_base
# from dotenv import load_dotenv
# import os

# load_dotenv()

# DATABASE_URL = os.getenv("DATABASE_URL")

# # Example:
# # postgresql+asyncpg://user:password@localhost/dbname
# if not DATABASE_URL.startswith("postgresql+asyncpg"):
#     raise RuntimeError("DATABASE_URL must use asyncpg driver")

# engine = create_async_engine(
#     DATABASE_URL,
#     echo=True,
#     future=True,
# )

# AsyncSessionLocal = sessionmaker(
#     bind=engine,
#     class_=AsyncSession,
#     expire_on_commit=False,
# )

# Base = declarative_base()

# # Dependency
# async def get_db():
#     async with AsyncSessionLocal() as session:
#         yield session
