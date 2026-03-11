#!/usr/bin/env python3
"""Test script to verify the server can start without errors."""

import sys
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

try:
    print("Testing imports...")
    from main import app
    print("✓ Main app imported successfully")
    
    from api.routes import documents, lifecycles, outcomes, predictions
    print("✓ All route modules imported successfully")
    
    from core.config import get_settings
    settings = get_settings()
    print(f"✓ Settings loaded: API port = {settings.api_port}")
    
    print("\n✓ All imports successful! Server should start correctly.")
    print("\nTo start the server, run:")
    print("  uvicorn main:app --reload --host 0.0.0.0 --port 8000")
    
except ImportError as e:
    print(f"✗ Import error: {e}")
    print("\nMake sure you're in the backend directory and virtual environment is activated.")
    sys.exit(1)
except Exception as e:
    print(f"✗ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
