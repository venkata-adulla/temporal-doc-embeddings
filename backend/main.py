import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from importlib import import_module

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

ROUTES = [
    ("chatbot", "/chatbot", ["chatbot"]),
    ("dashboard", "/dashboard", ["dashboard"]),
    ("documents", "/documents", ["documents"]),
    ("lifecycles", "/lifecycles", ["lifecycles"]),
    ("outcomes", "/outcomes", ["outcomes"]),
    ("predictions", "/predictions", ["predictions"]),
]

for module_name, base_prefix, tags in ROUTES:
    try:
        module = import_module(f"api.routes.{module_name}")
        app.include_router(module.router, prefix=base_prefix, tags=tags)
        app.include_router(module.router, prefix=f"/api{base_prefix}", tags=tags)
    except Exception as exc:
        logging.getLogger(__name__).warning(
            "Skipping route module '%s' due to import error: %s", module_name, exc
        )


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
        from core.database import create_neo4j_driver
        driver = None
        try:
            driver = create_neo4j_driver(connection_timeout=10)
            # verify_connectivity helps catch handshake/auth issues quickly.
            driver.verify_connectivity()
            with driver.session() as session:
                result = session.run("RETURN 1 as test")
                result.single()
            health["neo4j"] = "ok"
            logger.debug("Neo4j health check: OK")
        finally:
            if driver:
                try:
                    driver.close()
                except Exception:
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
        from core.database import build_postgres_connect_kwargs
        conn = psycopg2.connect(**build_postgres_connect_kwargs(timeout=5))
        conn.close()
        health["postgres"] = "ok"
        logger.debug("PostgreSQL health check: OK")
    except Exception as e:
        error_msg = str(e)
        health["postgres"] = f"error: {error_msg}"
        logger.warning(f"PostgreSQL health check failed: {error_msg}")
    
    # Check Qdrant
    try:
        from core.database import create_qdrant_client
        client = create_qdrant_client(timeout=5)
        client.get_collections()
        health["qdrant"] = "ok"
        logger.debug("Qdrant health check: OK")
    except Exception as e:
        error_msg = str(e)
        health["qdrant"] = f"error: {error_msg}"
        logger.warning(f"Qdrant health check failed: {error_msg}")
    
    return health
