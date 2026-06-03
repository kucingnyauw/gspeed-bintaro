import jwt from "jsonwebtoken";
import ApiError from "#shared/utils/error.js";

/**
 * JWT Manager untuk handle token authentication dan authorization
 * 
 * @class JWT
 * @description
 * Menyediakan utilitas untuk mengelola JSON Web Token dengan fitur:
 * - Generate access token dan refresh token
 * - Verify dan decode token
 * - Extract token dari berbagai sumber (header, cookie, query)
 * - Token expiration management
 * 
 * @example
 * const token = JWT.generateAccessToken({ userId: "123", role: "admin" });
 * const decoded = JWT.verifyToken(token);
 */
class JWT {
  /**
   * Default konfigurasi JWT
   * Bisa di-override melalui environment variables
   */
  static #config = {
    accessTokenSecret: process.env.JWT_ACCESS_SECRET,
    refreshTokenSecret: process.env.JWT_REFRESH_SECRET,
    accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY,
    refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY,
    issuer: process.env.JWT_ISSUER ,
    audience: process.env.JWT_AUDIENCE,
  };

  /**
   * Update konfigurasi JWT
   * @param {Object} config - Konfigurasi baru
   * @param {string} [config.accessTokenSecret] - Secret key untuk access token
   * @param {string} [config.refreshTokenSecret] - Secret key untuk refresh token
   * @param {string} [config.accessTokenExpiry] - Expiry time untuk access token
   * @param {string} [config.refreshTokenExpiry] - Expiry time untuk refresh token
   * @param {string} [config.issuer] - Token issuer
   * @param {string} [config.audience] - Token audience
   */
  static configure(config = {}) {
    if (config && typeof config === "object") {
      this.#config = {
        ...this.#config,
        ...config,
      };
    }
  }

  /**
   * Generate access token
   * @param {Object} payload - Data yang akan dimasukkan ke token
   * @param {Object} [options={}] - Opsi tambahan untuk token
   * @param {string} [options.expiresIn] - Custom expiry time
   * @returns {string} JWT access token
   * @throws {ApiError} Jika payload tidak valid atau proses generate gagal
   * @example
   * const token = JWT.generateAccessToken({ 
   *   userId: "123", 
   *   email: "user@example.com",
   *   role: "admin" 
   * });
   */
  static generateAccessToken(payload, options = {}) {
    try {
      if (!payload || typeof payload !== "object" || Object.keys(payload).length === 0) {
        throw ApiError.badRequest({
          message: "Payload token tidak boleh kosong.",
          code: "JWT_INVALID_PAYLOAD",
          details: { payload },
        });
      }

      const tokenOptions = {
        expiresIn: options.expiresIn || this.#config.accessTokenExpiry,
        issuer: this.#config.issuer,
        audience: this.#config.audience,
        ...options,
      };

      return jwt.sign(payload, this.#config.accessTokenSecret, tokenOptions);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      
      throw ApiError.internal({
        message: "Gagal membuat access token.",
        code: "JWT_GENERATE_ACCESS_ERROR",
        details: { error: error.message },
      });
    }
  }

  /**
   * Generate refresh token
   * @param {Object} payload - Data yang akan dimasukkan ke token
   * @param {Object} [options={}] - Opsi tambahan untuk token
   * @param {string} [options.expiresIn] - Custom expiry time
   * @returns {string} JWT refresh token
   * @throws {ApiError} Jika payload tidak valid atau proses generate gagal
   * @example
   * const refreshToken = JWT.generateRefreshToken({ userId: "123" });
   */
  static generateRefreshToken(payload, options = {}) {
    try {
      if (!payload || typeof payload !== "object" || Object.keys(payload).length === 0) {
        throw ApiError.badRequest({
          message: "Payload refresh token tidak boleh kosong.",
          code: "JWT_INVALID_REFRESH_PAYLOAD",
          details: { payload },
        });
      }

      const tokenOptions = {
        expiresIn: options.expiresIn || this.#config.refreshTokenExpiry,
        issuer: this.#config.issuer,
        audience: this.#config.audience,
        ...options,
      };

      return jwt.sign(payload, this.#config.refreshTokenSecret, tokenOptions);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      
      throw ApiError.internal({
        message: "Gagal membuat refresh token.",
        code: "JWT_GENERATE_REFRESH_ERROR",
        details: { error: error.message },
      });
    }
  }

  /**
   * Generate token pair (access + refresh)
   * @param {Object} payload - Data yang akan dimasukkan ke token
   * @param {Object} [options={}] - Opsi tambahan untuk token
   * @returns {{accessToken: string, refreshToken: string}} Token pair
   * @throws {ApiError} Jika payload tidak valid atau proses generate gagal
   * @example
   * const tokens = JWT.generateTokenPair({ userId: "123", role: "user" });
   */
  static generateTokenPair(payload, options = {}) {
    try {
      const accessToken = this.generateAccessToken(payload, options);
      const refreshToken = this.generateRefreshToken(payload, options);

      return { accessToken, refreshToken };
    } catch (error) {
      if (error instanceof ApiError) throw error;
      
      throw ApiError.internal({
        message: "Gagal membuat token pair.",
        code: "JWT_GENERATE_PAIR_ERROR",
        details: { error: error.message },
      });
    }
  }

  /**
   * Verify access token
   * @param {string} token - JWT access token yang akan diverifikasi
   * @returns {Object} Decoded token payload
   * @throws {ApiError} Jika token invalid, expired, atau verification gagal
   * @example
   * const decoded = JWT.verifyAccessToken(token);
   */
  static verifyAccessToken(token) {
    try {
      if (!token || typeof token !== "string") {
        throw ApiError.unauthorized({
          message: "Token tidak ditemukan atau format tidak valid.",
          code: "JWT_TOKEN_MISSING",
        });
      }

      const decoded = jwt.verify(token, this.#config.accessTokenSecret, {
        issuer: this.#config.issuer,
        audience: this.#config.audience,
      });

      return decoded;
    } catch (error) {
      if (error instanceof ApiError) throw error;

      if (error.name === "TokenExpiredError") {
        throw ApiError.unauthorized({
          message: "Token telah kadaluarsa. Silakan login kembali.",
          code: "JWT_TOKEN_EXPIRED",
          details: { expiredAt: error.expiredAt },
        });
      }

      if (error.name === "JsonWebTokenError") {
        throw ApiError.unauthorized({
          message: "Token tidak valid. Silakan login kembali.",
          code: "JWT_TOKEN_INVALID",
          details: { error: error.message },
        });
      }

      if (error.name === "NotBeforeError") {
        throw ApiError.unauthorized({
          message: "Token belum dapat digunakan.",
          code: "JWT_TOKEN_NOT_ACTIVE",
          details: { date: error.date },
        });
      }

      throw ApiError.internal({
        message: "Gagal memverifikasi access token.",
        code: "JWT_VERIFY_ACCESS_ERROR",
        details: { error: error.message },
      });
    }
  }

  /**
   * Verify refresh token
   * @param {string} token - JWT refresh token yang akan diverifikasi
   * @returns {Object} Decoded token payload
   * @throws {ApiError} Jika token invalid, expired, atau verification gagal
   * @example
   * const decoded = JWT.verifyRefreshToken(refreshToken);
   */
  static verifyRefreshToken(token) {
    try {
      if (!token || typeof token !== "string") {
        throw ApiError.unauthorized({
          message: "Refresh token tidak ditemukan atau format tidak valid.",
          code: "JWT_REFRESH_TOKEN_MISSING",
        });
      }

      const decoded = jwt.verify(token, this.#config.refreshTokenSecret, {
        issuer: this.#config.issuer,
        audience: this.#config.audience,
      });

      return decoded;
    } catch (error) {
      if (error instanceof ApiError) throw error;

      if (error.name === "TokenExpiredError") {
        throw ApiError.unauthorized({
          message: "Refresh token telah kadaluarsa. Silakan login kembali.",
          code: "JWT_REFRESH_TOKEN_EXPIRED",
          details: { expiredAt: error.expiredAt },
        });
      }

      if (error.name === "JsonWebTokenError") {
        throw ApiError.unauthorized({
          message: "Refresh token tidak valid.",
          code: "JWT_REFRESH_TOKEN_INVALID",
          details: { error: error.message },
        });
      }

      throw ApiError.internal({
        message: "Gagal memverifikasi refresh token.",
        code: "JWT_VERIFY_REFRESH_ERROR",
        details: { error: error.message },
      });
    }
  }

  /**
   * Decode token tanpa verifikasi (hanya membaca payload)
   * @param {string} token - JWT token yang akan didecode
   * @param {Object} [options={}] - Opsi decode
   * @param {boolean} [options.complete=false] - Jika true, mengembalikan header dan payload
   * @returns {Object|null} Decoded token payload atau null jika gagal
   * @example
   * const payload = JWT.decodeToken(token);
   * const full = JWT.decodeToken(token, { complete: true });
   */
  static decodeToken(token, options = {}) {
    try {
      if (!token || typeof token !== "string") {
        return null;
      }

      return jwt.decode(token, options);
    } catch (error) {
      return null;
    }
  }

  /**
   * Extract token dari HTTP request header
   * @param {Object} req - HTTP request object
   * @param {string} [headerName="authorization"] - Nama header yang mengandung token
   * @returns {string|null} Token string atau null jika tidak ditemukan
   * @example
   * // Dari Authorization header
   * const token = JWT.extractFromHeader(req);
   * // Dari custom header
   * const token = JWT.extractFromHeader(req, "x-access-token");
   */
  static extractFromHeader(req, headerName = "authorization") {
    try {
      const header = req?.headers?.[headerName];
      
      if (!header) return null;

      // Handle Bearer token
      if (header.startsWith("Bearer ")) {
        return header.slice(7);
      }

      return header;
    } catch {
      return null;
    }
  }

  /**
   * Extract token dari cookie
   * @param {Object} req - HTTP request object
   * @param {string} [cookieName="token"] - Nama cookie yang mengandung token
   * @returns {string|null} Token string atau null jika tidak ditemukan
   * @example
   * const token = JWT.extractFromCookie(req, "access_token");
   */
  static extractFromCookie(req, cookieName = "token") {
    try {
      return req?.cookies?.[cookieName] || null;
    } catch {
      return null;
    }
  }

  /**
   * Extract token dari query parameter
   * @param {Object} req - HTTP request object
   * @param {string} [queryParam="token"] - Nama query parameter
   * @returns {string|null} Token string atau null jika tidak ditemukan
   * @example
   * const token = JWT.extractFromQuery(req, "access_token");
   */
  static extractFromQuery(req, queryParam = "token") {
    try {
      return req?.query?.[queryParam] || null;
    } catch {
      return null;
    }
  }

  /**
   * Extract token dari berbagai sumber secara otomatis
   * @param {Object} req - HTTP request object
   * @param {Object} [options={}] - Opsi pencarian
   * @param {boolean} [options.header=true] - Cari di header Authorization
   * @param {boolean} [options.cookie=true] - Cari di cookies
   * @param {boolean} [options.query=true] - Cari di query parameters
   * @param {string} [options.cookieName="token"] - Nama cookie
   * @param {string} [options.queryParam="token"] - Nama query parameter
   * @returns {string|null} Token string atau null jika tidak ditemukan
   * @example
   * const token = JWT.extractToken(req);
   */
  static extractToken(req, options = {}) {
    const {
      header = true,
      cookie = true,
      query = true,
      cookieName = "token",
      queryParam = "token",
    } = options;

    // Cek header dulu
    if (header) {
      const token = this.extractFromHeader(req);
      if (token) return token;
    }

    // Cek cookie
    if (cookie) {
      const token = this.extractFromCookie(req, cookieName);
      if (token) return token;
    }

    // Cek query
    if (query) {
      const token = this.extractFromQuery(req, queryParam);
      if (token) return token;
    }

    return null;
  }

  /**
   * Refresh access token menggunakan refresh token
   * @param {string} refreshToken - Refresh token yang valid
   * @param {Object} [options={}] - Opsi untuk token baru
   * @returns {{accessToken: string, refreshToken: string}} Token pair baru
   * @throws {ApiError} Jika refresh token tidak valid
   * @example
   * const newTokens = JWT.refreshAccessToken(oldRefreshToken);
   */
  static refreshAccessToken(refreshToken, options = {}) {
    try {
      // Verify refresh token
      const decoded = this.verifyRefreshToken(refreshToken);

      // Remove iat, exp, iss, aud from decoded payload
      const { iat, exp, iss, aud, ...payload } = decoded;

      // Generate new token pair
      return this.generateTokenPair(payload, options);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      
      throw ApiError.internal({
        message: "Gagal merefresh access token.",
        code: "JWT_REFRESH_ERROR",
        details: { error: error.message },
      });
    }
  }

  /**
   * Mendapatkan sisa waktu token sebelum expired
   * @param {string} token - JWT token
   * @returns {number|null} Sisa waktu dalam detik, atau null jika token tidak valid
   * @example
   * const remaining = JWT.getTokenRemainingTime(token);
   */
  static getTokenRemainingTime(token) {
    try {
      const decoded = this.decodeToken(token);
      
      if (!decoded?.exp) return null;

      const now = Math.floor(Date.now() / 1000);
      const remaining = decoded.exp - now;

      return remaining > 0 ? remaining : 0;
    } catch {
      return null;
    }
  }

  /**
   * Cek apakah token akan expired dalam waktu tertentu
   * @param {string} token - JWT token
   * @param {number} [thresholdSeconds=300] - Threshold dalam detik (default 5 menit)
   * @returns {boolean} True jika token akan expired dalam threshold
   * @example
   * const needsRefresh = JWT.isTokenExpiringSoon(token, 600); // 10 menit
   */
  static isTokenExpiringSoon(token, thresholdSeconds = 300) {
    const remaining = this.getTokenRemainingTime(token);
    
    if (remaining === null) return true;
    
    return remaining <= thresholdSeconds;
  }
}

export default JWT;