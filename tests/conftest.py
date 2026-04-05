"""Shared test configuration and fixtures."""
import pytest
from httpx import AsyncClient, ASGITransport

# Override database to use in-memory SQLite for tests
import app.config
app.config.settings.database_url = "sqlite+aiosqlite:///:memory:"

from app.main import app as fastapi_app  # noqa: E402
from app.db.database import engine  # noqa: E402
from app.db.base import Base  # noqa: E402


@pytest.fixture(autouse=True)
async def setup_db():
    """Create tables before each test, drop after."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
async def client():
    """Provide an async HTTP test client."""
    async with AsyncClient(
        transport=ASGITransport(app=fastapi_app), base_url="http://test"
    ) as c:
        yield c


@pytest.fixture
async def sample_player(client: AsyncClient):
    """Create and return a sample player."""
    response = await client.post(
        "/api/players", json={"name": "John Doe", "phone": "9876543210"}
    )
    return response.json()["data"]
