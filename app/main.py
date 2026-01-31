import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse, JSONResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles

BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger("gravity")


@asynccontextmanager
async def lifespan(app: FastAPI):  # pragma: no cover - lifecycle logging
    logger.info("Gravity Force server starting")
    yield
    logger.info("Gravity Force server shutting down")


def create_app() -> FastAPI:
    app = FastAPI(
        title="Gravity Force WebGL",
        version="0.1.0",
        docs_url=None,
        redoc_url=None,
        lifespan=lifespan,
    )

    if not STATIC_DIR.exists():
        raise RuntimeError(f"Static directory missing: {STATIC_DIR}")

    logger.info("Mounting static files from %s", STATIC_DIR)
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

    @app.get("/")
    async def index() -> HTMLResponse:
        logger.info("Serving index.html")
        html = (STATIC_DIR / "index.html").read_text(encoding="utf-8")
        return HTMLResponse(html)

    @app.get("/favicon.ico")
    async def favicon() -> FileResponse:
        icon_path = STATIC_DIR / "favicon.ico"
        if icon_path.exists():
            return FileResponse(icon_path)
        raise RuntimeError("favicon not found")

    @app.get("/health")
    async def health() -> JSONResponse:
        logger.debug("Health check")
        return JSONResponse({"status": "ok"})

    return app


app = create_app()


if __name__ == "__main__":  # pragma: no cover - manual run helper
    import uvicorn

    logger.info("Launching uvicorn server on http://127.0.0.1:8000")
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=False)
