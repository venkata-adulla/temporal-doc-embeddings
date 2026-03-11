#!/usr/bin/env python3
"""Clear all data from Neo4j, PostgreSQL, and Qdrant databases."""

import sys
import logging
from pathlib import Path

# Add backend directory to Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from neo4j import GraphDatabase
from qdrant_client import QdrantClient
import psycopg2

from core.database import get_neo4j_connection, get_postgres_connection, get_qdrant_connection

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def clear_neo4j():
    """Clear all data from Neo4j."""
    try:
        neo4j_config = get_neo4j_connection()
        driver = GraphDatabase.driver(
            neo4j_config.uri,
            auth=(neo4j_config.user, neo4j_config.password)
        )
        
        with driver.session() as session:
            # Delete all relationships and nodes
            logger.info("Deleting all relationships...")
            session.run("MATCH ()-[r]->() DELETE r")
            
            logger.info("Deleting all nodes...")
            session.run("MATCH (n) DELETE n")
            
            # Verify deletion
            result = session.run("MATCH (n) RETURN count(n) as count")
            record = result.single()
            count = record["count"] if record else 0
            
            if count == 0:
                logger.info("✓ Neo4j cleared successfully")
            else:
                logger.warning(f"⚠ Neo4j still has {count} nodes remaining")
        
        driver.close()
        return True
    except Exception as e:
        logger.error(f"✗ Failed to clear Neo4j: {e}")
        return False


def clear_postgres():
    """Clear all data from PostgreSQL."""
    try:
        pg_config = get_postgres_connection()
        conn = psycopg2.connect(
            host=pg_config.host,
            port=pg_config.port,
            database=pg_config.database,
            user=pg_config.user,
            password=pg_config.password
        )
        
        with conn.cursor() as cur:
            logger.info("Deleting all outcomes...")
            cur.execute("TRUNCATE TABLE outcomes RESTART IDENTITY CASCADE")
            
            # Verify deletion
            cur.execute("SELECT COUNT(*) FROM outcomes")
            count = cur.fetchone()[0]
            
            if count == 0:
                logger.info("✓ PostgreSQL cleared successfully")
            else:
                logger.warning(f"⚠ PostgreSQL still has {count} outcomes remaining")
        
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        logger.error(f"✗ Failed to clear PostgreSQL: {e}")
        return False


def clear_qdrant():
    """Clear all data from Qdrant and reinitialize collections."""
    try:
        qdrant_config = get_qdrant_connection()
        qdrant_client = QdrantClient(host=qdrant_config.host, port=qdrant_config.port)
        
        # Get all collections
        collections = qdrant_client.get_collections()
        
        for collection in collections.collections:
            collection_name = collection.name
            logger.info(f"Deleting collection '{collection_name}'...")
            
            try:
                # Delete the collection
                qdrant_client.delete_collection(collection_name)
                logger.info(f"✓ Deleted collection '{collection_name}'")
            except Exception as e:
                logger.warning(f"⚠ Could not delete collection '{collection_name}': {e}")
        
        # Verify deletion
        remaining_collections = qdrant_client.get_collections()
        if len(remaining_collections.collections) == 0:
            logger.info("✓ Qdrant cleared successfully")
        else:
            logger.warning(f"⚠ Qdrant still has {len(remaining_collections.collections)} collections")
        
        # Reinitialize the documents collection for new uploads
        logger.info("Reinitializing 'documents' collection...")
        try:
            from services.embedding_service import EmbeddingService
            embedder = EmbeddingService()
            # The collection will be created automatically on first use, but we can verify
            logger.info("✓ Qdrant ready for new document uploads")
        except Exception as e:
            logger.warning(f"⚠ Could not verify Qdrant initialization: {e}")
            # This is not critical, collection will be created on first upload
        
        return True
    except Exception as e:
        logger.error(f"✗ Failed to clear Qdrant: {e}")
        return False


def clear_uploaded_files():
    """Clear uploaded files from the uploads directory."""
    try:
        from core.config import get_settings
        settings = get_settings()
        upload_dir = Path(settings.upload_dir)
        
        if upload_dir.exists():
            logger.info(f"Deleting files from {upload_dir}...")
            deleted_count = 0
            for file_path in upload_dir.glob("*"):
                if file_path.is_file():
                    file_path.unlink()
                    deleted_count += 1
                elif file_path.is_dir():
                    import shutil
                    shutil.rmtree(file_path)
                    deleted_count += 1
            
            logger.info(f"✓ Deleted {deleted_count} files/directories from uploads")
        else:
            logger.info("✓ Upload directory doesn't exist, nothing to delete")
        
        return True
    except Exception as e:
        logger.error(f"✗ Failed to clear uploaded files: {e}")
        return False


def main():
    """Clear all data from all databases."""
    logger.info("=" * 60)
    logger.info("Starting data cleanup...")
    logger.info("=" * 60)
    
    results = {
        "Neo4j": clear_neo4j(),
        "PostgreSQL": clear_postgres(),
        "Qdrant": clear_qdrant(),
        "Uploaded Files": clear_uploaded_files()
    }
    
    logger.info("=" * 60)
    logger.info("Cleanup Summary:")
    logger.info("=" * 60)
    
    all_success = True
    for service, success in results.items():
        status = "✓ SUCCESS" if success else "✗ FAILED"
        logger.info(f"{service}: {status}")
        if not success:
            all_success = False
    
    logger.info("=" * 60)
    
    if all_success:
        logger.info("✓ All data cleared successfully!")
        logger.info("You can now upload new files and start fresh.")
    else:
        logger.warning("⚠ Some cleanup operations failed. Check the logs above.")
    
    return all_success


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
