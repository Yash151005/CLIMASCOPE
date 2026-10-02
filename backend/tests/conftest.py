"""Isolate test databases from developer and production data."""

import os
import tempfile

import pytest

_test_db_dir = tempfile.TemporaryDirectory(prefix="climascope-tests-")
_test_db_path = os.path.join(_test_db_dir.name, "climascope-test.db").replace("\\", "/")
os.environ["DATABASE_URL"] = f"sqlite:///{_test_db_path}"
os.environ["ENVIRONMENT"] = "test"


@pytest.fixture(scope="session", autouse=True)
def dispose_test_database():
    yield
    from backend.app.db.session import engine

    engine.dispose()
    _test_db_dir.cleanup()
