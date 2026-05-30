import redis.asyncio as redis
from app.core.config import settings
from urllib.parse import urlparse


def _normalize_redis_url(redis_url: str) -> str:
    parsed = urlparse(redis_url)
    if parsed.hostname in {"localhost", "127.0.0.1", "ttp-redis"}:
        port = parsed.port or 6379
        path = parsed.path or "/1"
        return f"{parsed.scheme}://redis:{port}{path}"

    return redis_url

class RedisPubSubManager:
    def __init__(self):
        self.redis_url = _normalize_redis_url(settings.REDIS_URL)
        self.pool = None

    async def connect(self):
        if not self.pool:
            self.pool = redis.ConnectionPool.from_url(self.redis_url)
    
    async def disconnect(self):
        if self.pool:
            await self.pool.disconnect()

    def get_connection(self):
        return redis.Redis.from_url(self.redis_url)

    async def publish(self, channel: str, message: str):
        r = self.get_connection()
        await r.publish(channel, message)

redis_manager = RedisPubSubManager()