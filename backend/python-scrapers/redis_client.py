"""
Redis client for caching and job queues
"""
import redis
import json
from typing import Any, Optional
from loguru import logger

from config import settings


class RedisClient:
    """Redis client manager"""

    def __init__(self):
        self.client: Optional[redis.Redis] = None

    def connect(self):
        """Initialize Redis connection"""
        try:
            self.client = redis.Redis(
                host=settings.REDIS_HOST,
                port=settings.REDIS_PORT,
                db=settings.REDIS_DB,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5,
            )

            # Test connection
            self.client.ping()

            logger.info(f"Connected to Redis: {settings.REDIS_HOST}:{settings.REDIS_PORT}")

        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            raise

    def disconnect(self):
        """Close Redis connection"""
        if self.client:
            self.client.close()
            logger.info("Redis connection closed")

    def get(self, key: str) -> Optional[Any]:
        """Get value from Redis"""
        try:
            value = self.client.get(key)
            if value:
                return json.loads(value)
            return None
        except Exception as e:
            logger.error(f"Redis GET error for key {key}: {e}")
            return None

    def set(self, key: str, value: Any, ttl: int = 300) -> bool:
        """Set value in Redis with TTL"""
        try:
            serialized = json.dumps(value)
            return self.client.setex(key, ttl, serialized)
        except Exception as e:
            logger.error(f"Redis SET error for key {key}: {e}")
            return False

    def delete(self, key: str) -> bool:
        """Delete key from Redis"""
        try:
            return bool(self.client.delete(key))
        except Exception as e:
            logger.error(f"Redis DELETE error for key {key}: {e}")
            return False

    def exists(self, key: str) -> bool:
        """Check if key exists in Redis"""
        try:
            return bool(self.client.exists(key))
        except Exception as e:
            logger.error(f"Redis EXISTS error for key {key}: {e}")
            return False

    def publish(self, channel: str, message: Any) -> bool:
        """Publish message to Redis channel"""
        try:
            serialized = json.dumps(message)
            self.client.publish(channel, serialized)
            return True
        except Exception as e:
            logger.error(f"Redis PUBLISH error for channel {channel}: {e}")
            return False

    def subscribe(self, channel: str):
        """Subscribe to Redis channel"""
        try:
            pubsub = self.client.pubsub()
            pubsub.subscribe(channel)
            return pubsub
        except Exception as e:
            logger.error(f"Redis SUBSCRIBE error for channel {channel}: {e}")
            return None

    def lpush(self, key: str, value: Any) -> bool:
        """Push value to list (left)"""
        try:
            serialized = json.dumps(value)
            self.client.lpush(key, serialized)
            return True
        except Exception as e:
            logger.error(f"Redis LPUSH error for key {key}: {e}")
            return False

    def rpop(self, key: str) -> Optional[Any]:
        """Pop value from list (right)"""
        try:
            value = self.client.rpop(key)
            if value:
                return json.loads(value)
            return None
        except Exception as e:
            logger.error(f"Redis RPOP error for key {key}: {e}")
            return None


# Global Redis client instance
redis_client = RedisClient()
