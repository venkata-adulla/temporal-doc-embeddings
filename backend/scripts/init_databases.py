import logging
import sys
from pathlib import Path

# Add backend directory to Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from neo4j import GraphDatabase
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams

from core.config import get_settings
from core.database import get_neo4j_connection, get_postgres_connection, get_qdrant_connection

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def init_neo4j():
    """Initialize Neo4j with constraints and indexes."""
    try:
        neo4j_config = get_neo4j_connection()
        driver = GraphDatabase.driver(
            neo4j_config.uri,
            auth=(neo4j_config.user, neo4j_config.password)
        )

        with driver.session() as session:
            # Create constraints
            session.run("CREATE CONSTRAINT IF NOT EXISTS FOR (l:Lifecycle) REQUIRE l.lifecycle_id IS UNIQUE")
            session.run("CREATE CONSTRAINT IF NOT EXISTS FOR (d:Document) REQUIRE d.document_id IS UNIQUE")
            session.run("CREATE CONSTRAINT IF NOT EXISTS FOR (e:Event) REQUIRE e.event_id IS UNIQUE")
            
            # Create indexes
            session.run("CREATE INDEX IF NOT EXISTS FOR (l:Lifecycle) ON (l.status)")
            session.run("CREATE INDEX IF NOT EXISTS FOR (d:Document) ON (d.document_type)")
            session.run("CREATE INDEX IF NOT EXISTS FOR (e:Event) ON (e.event_type)")

        driver.close()
        logger.info("✓ Neo4j initialized")
        return True
    except Exception as e:
        logger.error(f"✗ Neo4j initialization failed: {e}")
        return False


def init_postgres():
    """Initialize PostgreSQL tables."""
    try:
        import psycopg2
        pg_config = get_postgres_connection()
        conn = psycopg2.connect(
            host=pg_config.host,
            port=pg_config.port,
            database=pg_config.database,
            user=pg_config.user,
            password=pg_config.password
        )

        with conn.cursor() as cur:
            # Outcomes table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS outcomes (
                    outcome_id VARCHAR(255) PRIMARY KEY,
                    lifecycle_id VARCHAR(255) NOT NULL,
                    outcome_type VARCHAR(100) NOT NULL,
                    value DOUBLE PRECISION NOT NULL,
                    recorded_at TIMESTAMP NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            
            # Indexes
            cur.execute("""
                CREATE INDEX IF NOT EXISTS idx_outcomes_lifecycle 
                    ON outcomes(lifecycle_id);
            """)
            cur.execute("""
                CREATE INDEX IF NOT EXISTS idx_outcomes_type 
                    ON outcomes(outcome_type);
            """)
            cur.execute("""
                CREATE INDEX IF NOT EXISTS idx_outcomes_recorded 
                    ON outcomes(recorded_at);
            """)

        conn.commit()
        conn.close()
        logger.info("✓ PostgreSQL initialized")
        return True
    except Exception as e:
        logger.error(f"✗ PostgreSQL initialization failed: {e}")
        return False


def init_qdrant():
    """Initialize Qdrant collection."""
    try:
        settings = get_settings()
        qdrant_config = get_qdrant_connection()
        
        client = QdrantClient(host=qdrant_config.host, port=qdrant_config.port)
        
        # Get embedding dimensions - try to load model, fallback to known dimensions
        dimensions = 1024  # Default for BAAI/bge-large-en-v1.5
        try:
            from sentence_transformers import SentenceTransformer
            model = SentenceTransformer(settings.embedding_model)
            dimensions = model.get_sentence_embedding_dimension()
            logger.info(f"Loaded model dimensions: {dimensions}")
        except Exception as model_error:
            logger.warning(f"Could not load model to get dimensions, using default {dimensions}: {model_error}")
            # Known dimensions for common models
            if "bge-large" in settings.embedding_model.lower():
                dimensions = 1024
            elif "bge-base" in settings.embedding_model.lower():
                dimensions = 768
            elif "bge-small" in settings.embedding_model.lower():
                dimensions = 384
            else:
                dimensions = 768  # Safe default
        
        # Create collection if it doesn't exist
        collections = client.get_collections().collections
        collection_names = [c.name for c in collections]
        
        if "documents" not in collection_names:
            client.create_collection(
                collection_name="documents",
                vectors_config=VectorParams(
                    size=dimensions,
                    distance=Distance.COSINE
                )
            )
            logger.info(f"✓ Qdrant collection 'documents' created with {dimensions} dimensions")
        else:
            logger.info("✓ Qdrant collection 'documents' already exists")
        
        return True
    except Exception as e:
        logger.error(f"✗ Qdrant initialization failed: {e}")
        return False


def main() -> None:
    """Initialize all databases."""
    logger.info("Initializing databases...")
    
    results = {
        "Neo4j": init_neo4j(),
        "PostgreSQL": init_postgres(),
        "Qdrant": init_qdrant(),
    }
    
    if all(results.values()):
        logger.info("\n✓ All databases initialized successfully!")
        sys.exit(0)
    else:
        logger.error("\n✗ Some databases failed to initialize:")
        for db, success in results.items():
            status = "✓" if success else "✗"
            logger.error(f"  {status} {db}")
        sys.exit(1)


if __name__ == "__main__":
    main()
