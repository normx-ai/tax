// server/src/utils/cache.ts
// Cache in-memory Map avec TTL (remplace Redis de cgi-engine)

import { createHash } from 'crypto';
import { createLogger } from './logger';

const logger = createLogger('CacheService');

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export const CACHE_TTL = {
  EMBEDDING: 60 * 60 * 24 * 7,    // 7 jours
  SEARCH_RESULT: 60 * 60,         // 1 heure
  ARTICLE: 60 * 60 * 24,          // 24 heures
  TENANT: 5 * 60,                 // 5 minutes
  SUBSCRIPTION: 5 * 60,           // 5 minutes — Invalidation event-based a implementer
  TOKEN_BLACKLIST: 24 * 60 * 60,  // 24 heures
};

export const CACHE_PREFIX = {
  EMBEDDING: 'emb:',
  SEARCH: 'search:',
  ARTICLE: 'article:',
  TENANT: 'tenant:',
  SUBSCRIPTION: 'sub:',
  BLACKLIST: 'bl:',
};

const MAX_CACHE_SIZE = 1000;

class CacheService {
  private store = new Map<string, CacheEntry<unknown>>();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Nettoyage toutes les 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    // LRU: repositionner l'entrée en fin de Map
    this.store.delete(key);
    this.store.set(key, entry);

    return entry.value as T;
  }

  set(key: string, value: unknown, ttlSeconds: number = CACHE_TTL.SEARCH_RESULT): void {
    if (this.store.has(key)) {
      this.store.delete(key);
    } else if (this.store.size >= MAX_CACHE_SIZE) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey !== undefined) {
        this.store.delete(oldestKey);
      }
    }

    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  del(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
    logger.info('Cache vidé');
  }

  size(): number {
    return this.store.size;
  }

  keys(prefix?: string): string[] {
    const allKeys = Array.from(this.store.keys());
    if (!prefix) return allKeys;
    return allKeys.filter(k => k.startsWith(prefix));
  }

  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;
    for (const [key, entry] of this.store) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
        cleaned++;
      }
    }
    if (cleaned > 0) {
      logger.debug(`Cache cleanup: ${cleaned} entrées supprimées`);
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.store.clear();
  }
}

export const cacheService = new CacheService();

/**
 * Hash SHA-256 d'un texte pour clé de cache (LOW-06)
 */
export function hashText(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

export default cacheService;
