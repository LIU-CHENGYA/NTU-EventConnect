"""Minimal in-process TTL cache for endpoints whose data rarely changes.

Usage:
    from app.core.cache import ttl_cache

    @ttl_cache(seconds=600)
    def expensive_query(lang: str) -> list[dict]:
        ...

The cache is keyed on the function's positional and keyword arguments.
It is cleared automatically when entries expire; there is no background
eviction thread — staleness is detected lazily on the next call.

This is intentionally simple: no Redis dependency, no distributed
invalidation. The daily 02:00 cron already refreshes the underlying DB data,
so a 10-minute TTL is conservative and safe for event categories / tags.
"""

import functools
import threading
import time
from typing import Any, Callable


def ttl_cache(seconds: int = 600) -> Callable:
    """Decorator that caches the return value for `seconds` seconds."""
    def decorator(fn: Callable) -> Callable:
        lock = threading.Lock()
        store: dict[Any, tuple[float, Any]] = {}  # key -> (expires_at, value)

        @functools.wraps(fn)
        def wrapper(*args, **kwargs):
            key = (args, tuple(sorted(kwargs.items())))
            now = time.monotonic()
            with lock:
                if key in store:
                    expires_at, cached = store[key]
                    if now < expires_at:
                        return cached
            result = fn(*args, **kwargs)
            with lock:
                store[key] = (now + seconds, result)
            return result

        def invalidate():
            with lock:
                store.clear()

        wrapper.invalidate = invalidate  # type: ignore[attr-defined]
        return wrapper
    return decorator
