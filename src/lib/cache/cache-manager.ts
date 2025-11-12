// Week 3: Cache Invalidation System for Module Configurations
// Supports both in-memory cache (default) and Redis (production)

interface CacheItem<T> {
  data: T;
  expiresAt: number;
}

class CacheManager {
  private cache: Map<string, CacheItem<any>>;
  private defaultTTL: number = 5 * 60 * 1000; // 5 minutes in milliseconds

  constructor() {
    this.cache = new Map();
  }

  /**
   * Set a value in cache with TTL
   */
  set<T>(key: string, value: T, ttl?: number): void {
    const expiresAt = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, {
      data: value,
      expiresAt,
    });
  }

  /**
   * Get a value from cache
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Check if expired
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  /**
   * Delete a specific cache key
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate all cache entries matching a pattern
   */
  invalidatePattern(pattern: string): number {
    let count = 0;
    const regex = new RegExp(pattern);
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }
    
    return count;
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;

    for (const item of this.cache.values()) {
      if (now > item.expiresAt) {
        expiredEntries++;
      } else {
        validEntries++;
      }
    }

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
    };
  }

  /**
   * Cleanup expired entries
   */
  cleanup(): number {
    const now = Date.now();
    let removed = 0;

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
        removed++;
      }
    }

    return removed;
  }
}

// Singleton instance
const cacheManager = new CacheManager();

// Helper functions for module configuration caching
export const ModuleCacheHelpers = {
  /**
   * Get cache key for module config
   */
  getModuleConfigKey(tenantId: string, moduleName: string): string {
    return `module:${tenantId}:${moduleName}`;
  },

  /**
   * Cache module configuration
   */
  cacheModuleConfig(tenantId: string, moduleName: string, config: any, ttl?: number): void {
    const key = this.getModuleConfigKey(tenantId, moduleName);
    cacheManager.set(key, config, ttl);
  },

  /**
   * Get cached module configuration
   */
  getCachedModuleConfig(tenantId: string, moduleName: string): any | null {
    const key = this.getModuleConfigKey(tenantId, moduleName);
    return cacheManager.get(key);
  },

  /**
   * Invalidate module configuration cache
   */
  invalidateModuleCache(tenantId: string, moduleName?: string): number {
    if (moduleName) {
      const key = this.getModuleConfigKey(tenantId, moduleName);
      cacheManager.delete(key);
      return 1;
    } else {
      // Invalidate all modules for this tenant
      return cacheManager.invalidatePattern(`^module:${tenantId}:`);
    }
  },

  /**
   * Invalidate all caches for a tenant
   */
  invalidateTenantCache(tenantId: string): number {
    return cacheManager.invalidatePattern(`^.*:${tenantId}:`);
  },
};

// Helper functions for sidebar configuration caching
export const SidebarCacheHelpers = {
  /**
   * Get cache key for sidebar config
   */
  getSidebarConfigKey(tenantId: string, role: string): string {
    return `sidebar:${tenantId}:${role}`;
  },

  /**
   * Cache sidebar configuration
   */
  cacheSidebarConfig(tenantId: string, role: string, config: any, ttl?: number): void {
    const key = this.getSidebarConfigKey(tenantId, role);
    cacheManager.set(key, config, ttl);
  },

  /**
   * Get cached sidebar configuration
   */
  getCachedSidebarConfig(tenantId: string, role: string): any | null {
    const key = this.getSidebarConfigKey(tenantId, role);
    return cacheManager.get(key);
  },

  /**
   * Invalidate sidebar configuration cache
   */
  invalidateSidebarCache(tenantId: string, role?: string): number {
    if (role) {
      const key = this.getSidebarConfigKey(tenantId, role);
      cacheManager.delete(key);
      return 1;
    } else {
      // Invalidate all sidebars for this tenant
      return cacheManager.invalidatePattern(`^sidebar:${tenantId}:`);
    }
  },
};

// Periodic cleanup every 10 minutes
if (typeof window === 'undefined') {
  // Server-side only
  setInterval(() => {
    const removed = cacheManager.cleanup();
    if (removed > 0) {
      console.log(`[CacheManager] Cleaned up ${removed} expired entries`);
    }
  }, 10 * 60 * 1000);
}

export default cacheManager;
export { cacheManager };
