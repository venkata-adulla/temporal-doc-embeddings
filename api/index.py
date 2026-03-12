"""Vercel Python entrypoint for the FastAPI backend."""

from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
BACKEND_DIR = ROOT / "backend"
BACKEND_API_DIR = BACKEND_DIR / "api"

if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))


# Vercel loads this file as module `api.index`, which creates a top-level
# `api` package for this directory. Our backend also has an `api` package
# (`backend/api`) that contains route modules. Rebind `api` to backend/api so
# imports like `import_module("api.routes.dashboard")` resolve correctly.
if BACKEND_API_DIR.exists():
    spec = spec_from_file_location("api", BACKEND_API_DIR / "__init__.py")
    if spec and spec.loader:
        backend_api_module = module_from_spec(spec)
        backend_api_module.__path__ = [str(BACKEND_API_DIR)]
        sys.modules["api"] = backend_api_module
        spec.loader.exec_module(backend_api_module)

from main import app  # noqa: E402
