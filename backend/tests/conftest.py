import pytest

from app import store


@pytest.fixture(autouse=True)
def clean_store():
    store.reset()
    yield
    store.reset()
