// #middleware/rateLimiterMiddleware.js
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import ApiError from "#shared/utils/error.js";
import logger from "#app/logger.js";

/**
 * Rate Limiter Middleware
 *
 * Membatasi jumlah request client dalam periode waktu tertentu.
 *
 * Default identifier:
 * - Authenticated: user.id
 * - Guest: normalized IP (IPv4/IPv6 safe)
 *
 * @param {Object} options - Opsi konfigurasi rate limiter
 * @param {number} [options.windowMs=60000] - Jendela waktu dalam milidetik
 * @param {number} [options.max=100] - Maksimum request dalam jendela waktu
 * @param {string} [options.message] - Pesan error kustom
 * @param {boolean} [options.skipFailedRequests=false] - Abaikan request gagal
 * @param {boolean} [options.skipSuccessfulRequests=false] - Abaikan request sukses
 * @param {Function} [options.keyGenerator] - Fungsi kustom untuk generate key
 * @param {Function} [options.skip] - Fungsi untuk skip rate limiter
 * @returns {Function} Middleware rate limiter
 */
const rateLimiterMiddleware = (options = {}) => {
  const {
    windowMs = 60_000,
    max = 100,
    message,
    skipFailedRequests = false,
    skipSuccessfulRequests = false,
    keyGenerator,
    skip,
  } = options;

  /**
   * Generate key untuk rate limiter
   *
   * @param {Object} req - Express request object
   * @returns {string} Key identifier
   */
  const safeKeyGenerator = (req) => {
    let key;

    if (typeof keyGenerator === "function") {
      key = keyGenerator(req);
      logger.debug("Rate limiter menggunakan custom key generator", {
        generatedKey: key,
        ip: req.ip,
        path: req.originalUrl,
        method: req.method,
      });
    } else {
      key = req.user?.id || ipKeyGenerator(req.ip);
      logger.debug("Rate limiter key generated", {
        type: req.user?.id ? "authenticated" : "guest",
        generatedKey: key,
        userId: req.user?.id || null,
        ip: req.ip,
        path: req.originalUrl,
        method: req.method,
      });
    }

    return key;
  };

  /**
   * Handler saat rate limit tercapai
   *
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   * @param {Object} limiterOptions - Opsi rate limiter
   */
  const handler = (req, res, next, limiterOptions) => {
    const retryAfter = Math.ceil(limiterOptions.windowMs / 1000);

    res.set("Retry-After", String(retryAfter));

    // Logging rate limit reached
    logger.warn("Rate limit reached - blocking request", {
      ip: req.ip,
      userId: req.user?.id || null,
      path: req.originalUrl,
      method: req.method,
      retryAfter: retryAfter,
      limit: max,
      windowMs: windowMs,
      headers: {
        "x-ratelimit-limit": res.get("X-RateLimit-Limit"),
        "x-ratelimit-remaining": res.get("X-RateLimit-Remaining"),
        "x-ratelimit-reset": res.get("X-RateLimit-Reset"),
      },
    });

    return next(
      ApiError.tooManyRequests({
        message:
          message ||
          `Terlalu banyak permintaan. Coba lagi dalam ${retryAfter} detik.`,
      })
    );
  };

  /**
   * Callback saat request diproses oleh rate limiter
   *
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {boolean} Status sukses
   */
  const requestWasSuccessful = (req, res) => {
    logger.debug("Rate limiter request processed", {
      ip: req.ip,
      path: req.originalUrl,
      method: req.method,
      remaining: res.get("X-RateLimit-Remaining"),
      limit: res.get("X-RateLimit-Limit"),
    });
    return res.statusCode < 400;
  };

  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: safeKeyGenerator,
    ...(skip && { skip }),
    skipFailedRequests,
    skipSuccessfulRequests,
    requestWasSuccessful,
    handler,
  });
};

export default rateLimiterMiddleware;