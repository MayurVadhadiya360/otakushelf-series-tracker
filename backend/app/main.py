from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse

from .config import get_config
from .logging_config import setup_logging
from .database import get_database, close_database
from .routers import auth, users, genres, series, data

logger = setup_logging()
config = get_config()

app = FastAPI(
    title="OtakuShelf API",
    description="Track novels, manga, manhua, manhwa, anime, donghua, and more.",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(genres.router)
app.include_router(series.router)
app.include_router(data.router)


@app.on_event("startup")
def on_startup():
    logger.info("=" * 60)
    logger.info("OtakuShelf API starting up")
    try:
        get_database()
    except Exception as e:
        # Don't crash the whole app on a transient connection issue; every
        # request that needs the DB will retry the connection and surface
        # a clear error if it's still down.
        logger.error(f"Could not connect to MongoDB at startup: {e}")


@app.on_event("shutdown")
def on_shutdown():
    logger.info("OtakuShelf API shutting down")
    close_database()


@app.get("/api/health", tags=["health"])
def health_check():
    return {"status": "ok"}


@app.exception_handler(Exception)
async def unhandled_exception_handler(request, exc):
    logger.error(f"Unhandled error on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


# ---------------------------------------------------------------------------
# Serve the built React app (production).
#
# In development the frontend runs via its own Vite dev server (see
# docker-compose.yml) and talks to this API over CORS, so this block simply
# does nothing unless a `static/` folder (the frontend's `npm run build`
# output) has been copied in — which is exactly what Dockerfile.prod does.
# ---------------------------------------------------------------------------
STATIC_DIR = Path(__file__).parent / "static"

if STATIC_DIR.exists():
    assets_dir = STATIC_DIR / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    def serve_spa(full_path: str):
        candidate = STATIC_DIR / full_path
        if full_path and candidate.is_file():
            return FileResponse(candidate)
        return FileResponse(STATIC_DIR / "index.html")

    logger.info(f"Serving built frontend from {STATIC_DIR}")
else:
    logger.info("No built frontend found — API-only mode (development)")
