import redis from "#lib/redis.js";
import ApiError from "#shared/utils/error.js";

/**
 * Cache Manager dengan dukungan namespacing, indexing, dan distributed locking
 * 
 * @class CacheManager
 * @description
 * Menyediakan utilitas untuk mengelola cache Redis dengan fitur:
 * - Namespacing cache menggunakan prefix
 * - Auto-indexing untuk memudahkan invalidation
 * - Serialisasi/deserialisasi JSON otomatis
 * - Distributed locking untuk mencegah race condition
 * 
 * @example
 * const userCache = new CacheManager("user");
 * await userCache.set("profile:123", { name: "John" }, 3600);
 * const data = await userCache.get("profile:123");
 */
class CacheManager {
  /**
   * Membuat instance CacheManager dengan prefix namespace
   * @param {string} prefix - Prefix namespace untuk cache (wajib)
   * @throws {ApiError} Jika prefix tidak diisi
   */
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

  /**
   * Membangun full cache key dengan prefix namespace
   * @param {string} key - Cache key (tanpa prefix)
   * @returns {string} Full cache key dengan format `{prefix}:{key}`
   * @throws {ApiError} Jika key kosong
   * @private
   */
  buildKey(key) {
    if (!key) {
      throw ApiError.badRequest({
        message: "Cache key tidak boleh kosong.",
        code: "CACHE_KEY_REQUIRED",
      });
    }
    return `${this.prefix}:${key}`;
  }

  /**
   * Mengambil data dari cache
   * @param {string} key - Cache key (tanpa prefix)
   * @returns {Promise<Object|string|null>} Data yang tersimpan atau null jika tidak ditemukan. Otomatis parse JSON, jika gagal mengembalikan string mentah.
   * @throws {ApiError} Jika terjadi kesalahan saat mengambil data dari Redis
   * @example
   * const user = await userCache.get("profile:123");
   * const token = await authCache.get("refresh:token");
   */
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

  /**
   * Menyimpan data ke cache dengan TTL
   * @param {string} key - Cache key (tanpa prefix)
   * @param {Object|string|number|boolean} value - Data yang akan disimpan (non-string akan di-serialize ke JSON)
   * @param {number} [ttlSeconds=60] - Time-to-live dalam detik
   * @returns {Promise<void>}
   * @throws {ApiError} Jika terjadi kesalahan saat menyimpan data ke Redis
   * @example
   * await cache.set("session:abc", { userId: "123" }, 3600);
   * await cache.set("token", "xyz123");
   */
  async set(key, value, ttlSeconds = 60) {
    try {
      const fullKey = this.buildKey(key);

      if (ttlSeconds <= 0) {
        throw ApiError.badRequest({
          message: "TTL cache harus lebih besar dari 0 detik.",
          code: "CACHE_INVALID_TTL",
          details: { ttlSeconds },
        });
      }

      const serialized =
        typeof value === "string" ? value : JSON.stringify(value);

      await redis.set(fullKey, serialized, { ex: ttlSeconds });
      await redis.sadd(this.indexKey, fullKey);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      
      throw ApiError.internal({
        message: "Gagal menyimpan data ke cache.",
        code: "CACHE_SET_ERROR",
        details: { key, error: error.message },
      });
    }
  }

  /**
   * Invalidasi (menghapus) cache berdasarkan pattern
   * @param {string} pattern - Pattern string untuk filter key yang akan dihapus
   * @returns {Promise<number>} Jumlah key yang berhasil dihapus
   * @throws {ApiError} Jika terjadi kesalahan saat invalidasi cache
   * @description Mencari semua key dalam namespace yang mengandung pattern, lalu menghapusnya dari Redis dan index
   * @example
   * const deletedCount = await cache.invalidate("user:profile");
   */
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

      const toDelete = keys.filter((k) => k.includes(pattern));

      if (toDelete.length) {
        await redis.del(toDelete);
        await redis.srem(this.indexKey, ...toDelete);
      }

      return toDelete.length;
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
   * Invalidasi (menghapus) seluruh cache dalam namespace ini
   * @returns {Promise<number>} Jumlah key yang berhasil dihapus
   * @throws {ApiError} Jika terjadi kesalahan saat menghapus seluruh cache
   * @description Menghapus semua key yang terdaftar di index dan mereset index key
   * @example
   * const deletedCount = await cache.invalidateAll();
   */
  async invalidateAll() {
    try {
      const keys = await redis.smembers(this.indexKey);

      if (keys?.length) {
        await redis.del(keys);
        await redis.del(this.indexKey);
        return keys.length;
      }

      return 0;
    } catch (error) {
      throw ApiError.internal({
        message: "Gagal menghapus seluruh cache dalam namespace ini.",
        code: "CACHE_INVALIDATE_ALL_ERROR",
        details: { prefix: this.prefix, error: error.message },
      });
    }
  }

  /**
   * Mendapatkan distributed lock untuk mencegah race condition
   * @param {string} key - Kunci untuk lock
   * @param {number} [ttlSeconds=10] - Durasi lock dalam detik
   * @returns {Promise<{lockKey: string, token: string}|null>} Object lock berisi lockKey dan token, atau null jika gagal mendapatkan lock
   * @throws {ApiError} Jika terjadi kesalahan saat mendapatkan lock
   * @description Menggunakan mekanisme NX (set only if not exists) untuk memastikan hanya satu proses yang mendapat lock
   * @example
   * const lock = await cache.acquireLock("order:123", 30);
   * if (lock) {
   *   try {
   *     await processOrder();
   *   } finally {
   *     await cache.releaseLock(lock);
   *   }
   * }
   */
  async acquireLock(key, ttlSeconds = 10) {
    try {
      if (!key) {
        throw ApiError.badRequest({
          message: "Lock key tidak boleh kosong.",
          code: "LOCK_KEY_REQUIRED",
        });
      }

      if (ttlSeconds <= 0) {
        throw ApiError.badRequest({
          message: "TTL lock harus lebih besar dari 0 detik.",
          code: "LOCK_INVALID_TTL",
          details: { ttlSeconds },
        });
      }

      const lockKey = this.buildKey(`lock:${key}`);
      const token = crypto.randomUUID();

      const result = await redis.set(lockKey, token, {
        nx: true,
        ex: ttlSeconds,
      });

      if (!result) {
        return null;
      }

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

  /**
   * Melepaskan distributed lock
   * @param {{lockKey: string, token: string}|null} lock - Object lock yang didapat dari acquireLock()
   * @returns {Promise<boolean>} True jika lock berhasil dilepaskan, false jika tidak
   * @throws {ApiError} Jika terjadi kesalahan saat melepaskan lock
   * @description Hanya menghapus lock jika token masih cocok (mencegah penghapusan lock milik proses lain)
   * @example
   * const released = await cache.releaseLock(lock);
   */
  async releaseLock(lock) {
    try {
      if (!lock) return false;

      const current = await redis.get(lock.lockKey);

      if (current === lock.token) {
        await redis.del(lock.lockKey);
        return true;
      }

      return false;
    } catch (error) {
      throw ApiError.internal({
        message: "Gagal melepaskan distributed lock.",
        code: "LOCK_RELEASE_ERROR",
        details: { lockKey: lock?.lockKey, error: error.message },
      });
    }
  }

  /**
   * Mendapatkan informasi tentang cache namespace ini
   * @returns {Promise<{prefix: string, totalKeys: number, keys: string[]}>} Informasi cache
   * @throws {ApiError} Jika terjadi kesalahan saat mengambil informasi cache
   * @example
   * const info = await cache.getInfo();
   */
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