import redis from "#lib/redis.js";
import ApiError from "#shared/utils/error.js";
import crypto from "crypto";

/**
 * Cache Manager with namespace, index tracking, and distributed locking
 */
class CacheManager {
  constructor(prefix) {
    if (!prefix) {
      throw ApiError.badRequest({
        message: "Prefix cache wajib diisi untuk membedakan namespace cache.",
        code: "CACHE_PREFIX_REQUIRED",
      });
    }

    this.prefix = prefix;
    this.indexKey = `${prefix}:__index__`;
  }

  buildKey(key) {
    if (!key) {
      throw ApiError.badRequest({
        message: "Cache key tidak boleh kosong.",
        code: "CACHE_KEY_REQUIRED",
      });
    }
    return `${this.prefix}:${key}`;
  }

  async get(key) {
    try {
      const fullKey = this.buildKey(key);
      const data = await redis.get(fullKey);

      if (!data) return null;

      try {
        return JSON.parse(data);
      } catch {
        return data;
      }
    } catch (error) {
      if (error instanceof ApiError) throw error;

      throw ApiError.internal({
        message: "Gagal mengambil data dari cache.",
        code: "CACHE_GET_ERROR",
        details: { key, error: error.message },
      });
    }
  }

  async set(key, value, ttlSeconds = 60) {
    try {
      if (ttlSeconds <= 0) {
        throw ApiError.badRequest({
          message: "TTL cache harus lebih besar dari 0 detik.",
          code: "CACHE_INVALID_TTL",
          details: { ttlSeconds },
        });
      }

      const fullKey = this.buildKey(key);

      const serialized =
        typeof value === "string" ? value : JSON.stringify(value);

      await redis.set(fullKey, serialized, { ex: ttlSeconds });

      // store raw key (NOT full key) to avoid double prefix issues
      await redis.sadd(this.indexKey, key);
    } catch (error) {
      if (error instanceof ApiError) throw error;

      throw ApiError.internal({
        message: "Gagal menyimpan data ke cache.",
        code: "CACHE_SET_ERROR",
        details: { key, error: error.message },
      });
    }
  }

  async invalidate(pattern) {
    try {
      if (!pattern) {
        throw ApiError.badRequest({
          message: "Pattern invalidasi cache tidak boleh kosong.",
          code: "CACHE_INVALIDATE_PATTERN_REQUIRED",
        });
      }

      const keys = await redis.smembers(this.indexKey);
      if (!keys?.length) return 0;

      const matched = keys.filter((k) => k.includes(pattern));

      if (!matched.length) return 0;

      const fullKeys = matched.map((k) => this.buildKey(k));

      if (fullKeys.length) {
        await redis.del(...fullKeys);
        await redis.srem(this.indexKey, ...matched);
      }

      return matched.length;
    } catch (error) {
      if (error instanceof ApiError) throw error;

      throw ApiError.internal({
        message: "Gagal melakukan invalidasi cache.",
        code: "CACHE_INVALIDATE_ERROR",
        details: { pattern, error: error.message },
      });
    }
  }

  /**
   * Delete a single cache key and remove it from index.
   *
   * @param {string} key - The cache key to delete (without prefix).
   * @returns {Promise<boolean>} `true` if the key was deleted, `false` if the key didn't exist.
   * @throws {ApiError} 400 - If key is empty.
   * @throws {ApiError} 500 - If deletion fails due to Redis error.
   *
   * @example
   * const cache = new CacheManager('user');
   * await cache.set('profile:123', { name: 'Budi' }, 3600);
   *
   * const deleted = await cache.delete('profile:123');
   * // deleted === true
   *
   * const notFound = await cache.delete('nonexistent');
   * // notFound === false
   */
  async delete(key) {
    try {
      if (!key) {
        throw ApiError.badRequest({
          message: "Cache key tidak boleh kosong.",
          code: "CACHE_KEY_REQUIRED",
        });
      }

      const fullKey = this.buildKey(key);

      const deleted = await redis.del(fullKey);

      if (deleted > 0) {
        await redis.srem(this.indexKey, key);
      }

      return deleted > 0;
    } catch (error) {
      if (error instanceof ApiError) throw error;

      throw ApiError.internal({
        message: "Gagal menghapus data dari cache.",
        code: "CACHE_DELETE_ERROR",
        details: { key, error: error.message },
      });
    }
  }

  async invalidateAll() {
    try {
      const keys = await redis.smembers(this.indexKey);

      if (!keys?.length) return 0;

      const fullKeys = keys.map((k) => this.buildKey(k));

      if (fullKeys.length) {
        await redis.del(...fullKeys);
      }

      await redis.del(this.indexKey);

      return keys.length;
    } catch (error) {
      throw ApiError.internal({
        message: "Gagal menghapus seluruh cache dalam namespace ini.",
        code: "CACHE_INVALIDATE_ALL_ERROR",
        details: { prefix: this.prefix, error: error.message },
      });
    }
  }

  async acquireLock(key, ttlSeconds = 10) {
    try {
      if (!key) {
        throw ApiError.badRequest({
          message: "Lock key tidak boleh kosong.",
          code: "LOCK_KEY_REQUIRED",
        });
      }

      const lockKey = this.buildKey(`lock:${key}`);
      const token = crypto.randomUUID();

      const result = await redis.set(lockKey, token, {
        nx: true,
        ex: ttlSeconds,
      });

      if (!result) return null;

      return { lockKey, token };
    } catch (error) {
      if (error instanceof ApiError) throw error;

      throw ApiError.internal({
        message: "Gagal mendapatkan distributed lock.",
        code: "LOCK_ACQUIRE_ERROR",
        details: { key, error: error.message },
      });
    }
  }

  async releaseLock(lock) {
    try {
      if (!lock) return false;

      const current = await redis.get(lock.lockKey);

      if (current !== lock.token) return false;

      await redis.del(lock.lockKey);
      return true;
    } catch (error) {
      throw ApiError.internal({
        message: "Gagal melepaskan distributed lock.",
        code: "LOCK_RELEASE_ERROR",
        details: { lockKey: lock?.lockKey, error: error.message },
      });
    }
  }

  async getInfo() {
    try {
      const keys = await redis.smembers(this.indexKey);

      return {
        prefix: this.prefix,
        totalKeys: keys?.length || 0,
        keys: keys || [],
      };
    } catch (error) {
      throw ApiError.internal({
        message: "Gagal mengambil informasi cache.",
        code: "CACHE_INFO_ERROR",
        details: { prefix: this.prefix, error: error.message },
      });
    }
  }
}

export default CacheManager;
