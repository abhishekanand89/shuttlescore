"""Badminton Scorer — FastAPI Application."""
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.db.database import engine
from app.db.base import Base
from app.api import health, players, matches, tournaments, analytics, leagues
import app.models.league  # noqa: ensure tables are registered


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create database tables on startup."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(
    title="Badminton Scorer API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse

app.include_router(health.router, prefix="/api")
app.include_router(players.router, prefix="/api")
app.include_router(matches.router, prefix="/api")
app.include_router(tournaments.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(leagues.router, prefix="/api")


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Transform HTTPException into standard error response format."""
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "error": exc.detail},
    )

# Serve frontend static assets and SPA fallback
frontend_dist = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist")
if os.path.exists(frontend_dist):
    # Mount only the /assets directory for JS/CSS bundles
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="static-assets")

    # SPA catch-all: serve index.html for any non-API GET request
    _index_path = os.path.join(frontend_dist, "index.html")
    with open(_index_path, "r") as f:
        _index_html_content = f.read()

    @app.get("/{full_path:path}")
    async def spa_fallback(request: Request, full_path: str):
        # Serve known static files (favicon, icons, etc.) directly
        file_path = os.path.join(frontend_dist, full_path)
        if full_path and os.path.isfile(file_path):
            from starlette.responses import FileResponse
            return FileResponse(file_path)
        # Otherwise serve index.html for client-side routing
        return HTMLResponse(content=_index_html_content, status_code=200)

