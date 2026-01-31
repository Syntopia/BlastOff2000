import pathlib

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import create_app


@pytest.fixture
def app():
    return create_app()


@pytest.mark.asyncio
async def test_health(app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/health")
    assert res.status_code == 200
    assert res.json().get("status") == "ok"


@pytest.mark.asyncio
async def test_index_served(app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/")
    assert res.status_code == 200
    assert 'text/html' in res.headers['content-type']


@pytest.mark.asyncio
async def test_static_assets_exist(app):
    static_dir = pathlib.Path(__file__).resolve().parents[1] / "app" / "static"
    for filename in ("index.html", "main.js", "game.js", "gl.js", "style.css"):
        assert (static_dir / filename).exists(), f"Missing static asset {filename}"

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/static/main.js")
    assert res.status_code == 200
