import socket
from dataclasses import dataclass
from typing import Optional
from urllib.parse import urlparse

from neo4j import GraphDatabase
from qdrant_client import QdrantClient

from core.config import get_settings


@dataclass
class Neo4jConnection:
    uri: str
    user: str
    password: str


@dataclass
class PostgresConnection:
    host: str
    port: int
    database: str
    user: str
    password: str
    hostaddr: str = ""
    sslmode: str = "prefer"


@dataclass
class QdrantConnection:
    host: str
    port: int
    api_key: str = ""
    url: str = ""


def _normalize_secret_value(value: Optional[str]) -> str:
    if value is None:
        return ""
    return str(value).strip().strip("'\"")


def _is_local_host(host: str) -> bool:
    return host in {"localhost", "127.0.0.1", "::1"}


def _coerce_neo4j_uri(uri: str) -> str:
    """Normalize Neo4j URI variants frequently used in deployment env vars."""
    candidate = _normalize_secret_value(uri).rstrip("/")
    if not candidate:
        return ""

    lower = candidate.lower()
    if lower.startswith("https://"):
        return "neo4j+s://" + candidate[len("https://") :]
    if lower.startswith("http://"):
        return "bolt://" + candidate[len("http://") :]
    if "://" not in candidate:
        host_only = candidate.split("/", 1)[0].split(":", 1)[0]
        scheme = "bolt" if _is_local_host(host_only) else "neo4j+s"
        candidate = f"{scheme}://{candidate}"

    # Aura users sometimes paste HTTP Query API URLs (with /db/.../query/v2).
    # Neo4j drivers require only scheme://host[:port].
    parsed = urlparse(candidate)
    if parsed.scheme and parsed.netloc:
        return f"{parsed.scheme}://{parsed.netloc}"
    return candidate


def _resolve_neo4j_uri(settings) -> str:
    default_uri = "bolt://localhost:7689"

    configured_uri = _coerce_neo4j_uri(settings.neo4j_uri)
    configured_url = _coerce_neo4j_uri(getattr(settings, "neo4j_url", ""))

    # Backwards compatibility:
    # - prefer NEO4J_URI if explicitly set
    # - fallback to NEO4J_URL when NEO4J_URI remains default/missing
    if configured_uri and configured_uri != default_uri:
        return configured_uri
    if configured_url:
        return configured_url

    host = _normalize_secret_value(getattr(settings, "neo4j_host", ""))
    port = int(getattr(settings, "neo4j_port", 0) or 0)
    scheme = _normalize_secret_value(getattr(settings, "neo4j_scheme", ""))
    if host:
        host_candidate = _coerce_neo4j_uri(host)
        if "://" in host_candidate:
            return host_candidate
        resolved_scheme = scheme or ("bolt" if _is_local_host(host) else "neo4j+s")
        resolved_port = port or (7689 if _is_local_host(host) else 7687)
        return f"{resolved_scheme}://{host}:{resolved_port}"

    return configured_uri or default_uri


def get_neo4j_connection() -> Neo4jConnection:
    settings = get_settings()
    return Neo4jConnection(
        uri=_resolve_neo4j_uri(settings),
        user=_normalize_secret_value(settings.neo4j_user),
        password=_normalize_secret_value(settings.neo4j_password),
    )


def create_neo4j_driver(connection_timeout: int = 10):
    neo4j_config = get_neo4j_connection()
    return GraphDatabase.driver(
        neo4j_config.uri,
        auth=(neo4j_config.user, neo4j_config.password),
        connection_timeout=connection_timeout,
        max_connection_lifetime=3600,
    )


def get_postgres_connection() -> PostgresConnection:
    settings = get_settings()
    return PostgresConnection(
        host=_normalize_secret_value(settings.postgres_host),
        port=settings.postgres_port,
        database=_normalize_secret_value(settings.postgres_db),
        user=_normalize_secret_value(settings.postgres_user),
        password=_normalize_secret_value(settings.postgres_password),
        hostaddr=_normalize_secret_value(settings.postgres_hostaddr),
        sslmode=_normalize_secret_value(settings.postgres_sslmode) or "prefer",
    )


def _resolve_ipv4_hostaddr(host: str, port: int) -> str:
    try:
        if host in {"localhost", "127.0.0.1"}:
            return ""
        entries = socket.getaddrinfo(host, port, family=socket.AF_INET, type=socket.SOCK_STREAM)
        for entry in entries:
            address = entry[4][0]
            if address:
                return address
    except Exception:
        return ""
    return ""


def build_postgres_connect_kwargs(timeout: Optional[int] = None) -> dict:
    pg = get_postgres_connection()
    kwargs = {
        "host": pg.host,
        "port": pg.port,
        "dbname": pg.database,
        "user": pg.user,
        "password": pg.password,
        "sslmode": pg.sslmode or "prefer",
    }

    if timeout is not None:
        kwargs["connect_timeout"] = timeout

    hostaddr = (pg.hostaddr or "").strip() or _resolve_ipv4_hostaddr(pg.host, pg.port)
    if hostaddr:
        kwargs["hostaddr"] = hostaddr

    return kwargs


def get_qdrant_connection() -> QdrantConnection:
    settings = get_settings()
    return QdrantConnection(
        host=_normalize_secret_value(settings.qdrant_host),
        port=settings.qdrant_port,
        api_key=_normalize_secret_value(settings.qdrant_api_key),
        url=_normalize_secret_value(settings.qdrant_url),
    )


def create_qdrant_client(timeout: Optional[int] = None) -> QdrantClient:
    """Create a Qdrant client supporting local host/port and cloud URL+API key."""
    qdrant_config = get_qdrant_connection()

    if qdrant_config.url:
        kwargs = {"url": qdrant_config.url}
        if qdrant_config.api_key:
            kwargs["api_key"] = qdrant_config.api_key
        if timeout is not None:
            kwargs["timeout"] = timeout
        return QdrantClient(**kwargs)

    kwargs = {"host": qdrant_config.host, "port": qdrant_config.port}
    if qdrant_config.api_key:
        kwargs["api_key"] = qdrant_config.api_key
    if timeout is not None:
        kwargs["timeout"] = timeout
    return QdrantClient(**kwargs)


_initialized: Optional[bool] = None


def initialize_datastores() -> None:
    global _initialized
    if _initialized:
        return
    _initialized = True
