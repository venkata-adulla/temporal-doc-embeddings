#!/usr/bin/env python3
"""Seed sample lifecycles in Neo4j for testing."""

import sys
from pathlib import Path

# Add backend directory to Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

import logging
from datetime import datetime, timedelta
from services.lifecycle_service import LifecycleService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def seed_lifecycles():
    """Create sample lifecycles with events."""
    service = LifecycleService()
    
    if not service.driver:
        logger.error("Failed to connect to Neo4j")
        return False
    
    # Create lifecycle_001 (generic example - can be any industry)
    logger.info("Creating lifecycle_001...")
    service.create_lifecycle("lifecycle_001", status="active", lifecycle_type="generic", domain="example")
    
    # Add some events (generic event types - works for any lifecycle)
    base_time = datetime.utcnow() - timedelta(days=30)
    service.add_event(
        "lifecycle_001",
        "DOCUMENT_CREATED",
        "Initial document DOC-12345 created",
        base_time
    )
    service.add_event(
        "lifecycle_001",
        "CHANGE_EVENT",
        "Modification MOD-001 approved",
        base_time + timedelta(days=5)
    )
    service.add_event(
        "lifecycle_001",
        "COMPLETION_EVENT",
        "Milestone completed",
        base_time + timedelta(days=15)
    )
    
    # Create lifecycle_002
    logger.info("Creating lifecycle_002...")
    service.create_lifecycle("lifecycle_002", status="pending", lifecycle_type="generic", domain="example")
    
    service.add_event(
        "lifecycle_002",
        "DOCUMENT_CREATED",
        "Initial document DOC-67890 created",
        base_time + timedelta(days=10)
    )
    service.add_event(
        "lifecycle_002",
        "RISK_ALERT",
        "Risk score exceeded threshold",
        base_time + timedelta(days=20)
    )
    
    # Create lifecycle_003
    logger.info("Creating lifecycle_003...")
    service.create_lifecycle("lifecycle_003", status="active", lifecycle_type="generic", domain="example")
    
    service.add_event(
        "lifecycle_003",
        "DOCUMENT_CREATED",
        "Initial document DOC-11111 created",
        base_time + timedelta(days=2)
    )
    
    service.close()
    logger.info("✓ Sample lifecycles created successfully")
    return True


if __name__ == "__main__":
    success = seed_lifecycles()
    sys.exit(0 if success else 1)
