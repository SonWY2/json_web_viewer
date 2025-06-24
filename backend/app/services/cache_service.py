from typing import Any, Optional, Dict, List
import time
import threading
from functools import lru_cache
import hashlib
import json

class CacheService:
    """Memory-based caching service"""
    
    def __init__(self, max_size: int = 1000, ttl: int = 3600):
        self.cache: Dict[str, Dict[str, Any]] = {}
        self.max_size = max_size
        self.ttl = ttl
        self._lock = threading.Lock()
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """Set cache value"""
        expire_time = time.time() + (ttl or self.ttl)
        
        with self._lock:
            # Clean expired entries if cache is full
            if len(self.cache) >= self.max_size:
                self._cleanup_expired()
                
                # If still full, remove oldest entries
                if len(self.cache) >= self.max_size:
                    oldest_keys = sorted(self.cache.keys(), 
                                       key=lambda k: self.cache[k]['created'])[:self.max_size // 4]
                    for old_key in oldest_keys:
                        del self.cache[old_key]
            
            self.cache[key] = {
                'value': value,
                'expires': expire_time,
                'created': time.time()
            }
    
    def get(self, key: str) -> Optional[Any]:
        """Get cache value"""
        with self._lock:
            if key not in self.cache:
                return None
            
            entry = self.cache[key]
            
            # Check expiration
            if time.time() > entry['expires']:
                del self.cache[key]
                return None
            
            return entry['value']
    
    def delete(self, key: str) -> bool:
        """Delete cache entry"""
        with self._lock:
            if key in self.cache:
                del self.cache[key]
                return True
            return False
    
    def clear(self) -> None:
        """Clear all cache"""
        with self._lock:
            self.cache.clear()
    
    def _cleanup_expired(self) -> None:
        """Remove expired entries"""
        current_time = time.time()
        expired_keys = [
            key for key, entry in self.cache.items()
            if current_time > entry['expires']
        ]
        for key in expired_keys:
            del self.cache[key]
    
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        with self._lock:
            return {
                'size': len(self.cache),
                'max_size': self.max_size,
                'hit_ratio': getattr(self, '_hits', 0) / max(getattr(self, '_requests', 1), 1)
            }

# Global cache instance
cache_service = CacheService()
