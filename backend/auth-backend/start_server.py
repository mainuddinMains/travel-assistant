#!/usr/bin/env python3
"""
Start script for Travel Assistant Auth Backend
"""
import asyncio
import uvicorn
import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

async def setup_database():
    """Setup database tables if they don't exist"""
    try:
        from app.db.base import Base
        from app.db.session import engine
        
        print("Setting up database tables...")
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("Database tables ready!")
        
    except Exception as e:
        print(f"Database setup failed: {e}")
        print("Continuing anyway - tables might already exist...")

async def main():
    """Main startup function"""
    print("Starting Travel Assistant Authentication Backend...")
    print("Server will be available at: http://localhost:8001")
    print("API documentation at: http://localhost:8001/docs")
    print("Health check at: http://localhost:8001/healthz")
    print("Database: PostgreSQL")
    print("Security: JWT + bcrypt")
    
    # Setup database
    await setup_database()
    
    # Start server using uvicorn server directly
    config = uvicorn.Config(
        "app.main:app",
        host="0.0.0.0",
        port=8001,
        reload=False,  # Disable reload in Docker
        log_level="info"
    )
    server = uvicorn.Server(config)
    await server.serve()

if __name__ == "__main__":
    asyncio.run(main())
