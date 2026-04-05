"""Badminton Scorer — FastAPI Application."""
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.db.database import engine
from app.db.base import Base
from app.api import health, players, matches, tournaments


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


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Transform HTTPException into standard error response format."""
    # SPA routing fallback for GET requests that return 404 (react router handles it)
    if exc.status_code == 404 and request.method == "GET" and not request.url.path.startswith("/api"):
        frontend_dist = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist")
        index_file = os.path.join(frontend_dist, "index.html")
        if os.path.exists(index_file):
            with open(index_file, "r") as f:
                return HTMLResponse(content=f.read(), status_code=200)
                
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "error": exc.detail},
    )

# Mount the static directory statically, if missing no problem
frontend_dist = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist")
if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="static")

