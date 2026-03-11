import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import chatbot, dashboard, documents, lifecycles, outcomes, predictions
from core.config import get_settings

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

settings = get_settings()

app = FastAPI(
    title="Temporal Document Embeddings API",
    description="Enterprise lifecycle intelligence and predictive risk analytics",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_origin_regex=settings.allowed_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

app.include_router(chatbot.router, prefix="/api/chatbot", tags=["chatbot"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
app.include_router(documents.router, prefix="/api/documents", tags=["documents"])
app.include_router(lifecycles.router, prefix="/api/lifecycles", tags=["lifecycles"])
app.include_router(outcomes.router, prefix="/api/outcomes", tags=["outcomes"])
app.include_router(predictions.router, prefix="/api/predictions", tags=["predictions"])


@app.get("/")
def root():
    """Root endpoint."""
    return {
        "message": "Temporal Document Embeddings API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }


@app.get("/health")
@app.get("/api/health")
def health_check() -> dict:
    """Basic health check."""
    return {"status": "ok"}


@app.get("/health/detailed")
@app.get("/api/health/detailed")
def detailed_health_check() -> dict:
    """Detailed health check for all services."""
    import logging
    from neo4j import GraphDatabase
    from qdrant_client import QdrantClient
    import psycopg2
    
    logger = logging.getLogger(__name__)
    
    health = {
        "api": "ok",
        "neo4j": "unknown",
        "postgres": "unknown",
        "qdrant": "unknown"
    }
    
    # Check Neo4j
    try:
        from core.database import get_neo4j_connection
        neo4j_config = get_neo4j_connection()
        driver = None
        try:
            # Use connection_timeout and max_connection_lifetime for better reliability
            driver = GraphDatabase.driver(
                neo4j_config.uri,
                auth=(neo4j_config.user, neo4j_config.password),
                connection_timeout=10,  # 10 second timeout
                max_connection_lifetime=3600
            )
            # Verify connectivity with a simple query instead of verify_connectivity()
            # This is more reliable and actually tests the connection
            with driver.session() as session:
                result = session.run("RETURN 1 as test")
                result.single()  # Consume the result
            health["neo4j"] = "ok"
            logger.debug("Neo4j health check: OK")
        finally:
            if driver:
                try:
                    driver.close()
                except:
                    pass
    except Exception as e:
        error_msg = str(e)
        # Check for specific error types and provide helpful messages
        if "Connection refused" in error_msg or "Failed to establish connection" in error_msg:
            health["neo4j"] = "error: Connection refused - check if Neo4j is running on port 7689"
        elif "Authentication" in error_msg or "auth" in error_msg.lower():
            health["neo4j"] = "error: Authentication failed - check credentials"
        else:
            # Truncate long error messages for frontend
            health["neo4j"] = f"error: {error_msg[:80]}"
        logger.warning(f"Neo4j health check failed: {error_msg}")
    
    # Check PostgreSQL
    try:
        from core.database import get_postgres_connection
        pg_config = get_postgres_connection()
        conn = psycopg2.connect(
            host=pg_config.host,
            port=pg_config.port,
            database=pg_config.database,
            user=pg_config.user,
            password=pg_config.password,
            connect_timeout=5  # 5 second timeout
        )
        conn.close()
        health["postgres"] = "ok"
        logger.debug("PostgreSQL health check: OK")
    except Exception as e:
        error_msg = str(e)
        health["postgres"] = f"error: {error_msg}"
        logger.warning(f"PostgreSQL health check failed: {error_msg}")
    
    # Check Qdrant
    try:
        from core.database import get_qdrant_connection
        qdrant_config = get_qdrant_connection()
        client = QdrantClient(
            host=qdrant_config.host,
            port=qdrant_config.port,
            timeout=5  # 5 second timeout
        )
        client.get_collections()
        health["qdrant"] = "ok"
        logger.debug("Qdrant health check: OK")
    except Exception as e:
        error_msg = str(e)
        health["qdrant"] = f"error: {error_msg}"
        logger.warning(f"Qdrant health check failed: {error_msg}")
    
    return health
