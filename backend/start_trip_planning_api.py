#!/usr/bin/env python3
"""
Startup script for the Trip Planning API
"""

import os
import sys
from pathlib import Path

# Add the current directory to Python path
current_dir = Path(__file__).parent
sys.path.insert(0, str(current_dir))

# Set environment variables
os.environ.setdefault('FLASK_ENV', 'development')
os.environ.setdefault('FLASK_DEBUG', '1')

if __name__ == '__main__':
    try:
        from trip_planning_api import app
        print("🚀 Starting Trip Planning API Server...")
        print("📍 Server will be available at: http://localhost:5001")
        print("🔗 Frontend can connect to: http://localhost:5001/api/trip-planning/")
        print("\n📋 Available endpoints:")
        print("  • POST /api/trip-planning/chat")
        print("  • POST /api/trip-planning/initialize") 
        print("  • GET /api/trip-planning/status")
        print("  • GET /health")
        print("\n" + "="*50)
        
        app.run(host='0.0.0.0', port=5001, debug=True)
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("Make sure you have installed the requirements:")
        print("pip install -r requirements.txt")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        sys.exit(1)



