import supabase from "#lib/supabase.js";
import UserRepository from "#repository/userRepository.js";
import ApiError from "#shared/utils/error.js";
import CacheManager from "#shared/utils/cache.js";
import JWT from "#shared/utils/jwt.js";
import logger from "#app/logger.js";
import { isProd } from "#config/env.js";

const userRepo = new UserRepository();
const userCache = new CacheManager("auth:user");

/**
 * Verifikasi token Supabase di production environment
 * @param {string} token - Access token dari Supabase Auth
 * @returns {Promise<Object>} Data user dari Supabase
 * @throws {ApiError} 401 - SESSION_EXPIRED - Jika token JWT invalid/expired
 * @throws {ApiError} 401 - INVALID_SESSION - Jika user tidak ditemukan di Supabase
 * @throws {ApiError} 503 - AUTH_SERVICE_UNAVAILABLE - Jika Supabase error
 * @throws {ApiError} 503 - NETWORK_ERROR - Jika gagal koneksi ke Supabase
 * @private
 */
const getSupabaseUser = async (token) => {
  try {
    logger.info("[AUTH] Verify Supabase User");

    const { data, error } = await supabase.auth.getUser(token);

    if (error) {
      logger.error("[AUTH] Supabase Error", { error: error.message });

      const errorMessage = error.message?.toLowerCase() || "";

      if (
        errorMessage.includes("jwt") ||
        errorMessage.includes("expired") ||
        errorMessage.includes("invalid")
      ) {
        throw ApiError.unauthorized({
          code: "SESSION_EXPIRED",
          message: "Sesi login Anda sudah berakhir. Silakan login kembali untuk melanjutkan.",
        });
      }

      throw ApiError.serviceUnavailable({
        code: "AUTH_SERVICE_UNAVAILABLE",
        message: "Layanan autentikasi sedang mengalami gangguan. Silakan coba beberapa saat lagi.",
      });
    }

    if (!data?.user) {
      throw ApiError.unauthorized({
        code: "INVALID_SESSION",
        message: "Sesi login tidak valid. Silakan login kembali untuk melanjutkan.",
      });
    }

    return data.user;
  } catch (err) {
    if (err instanceof ApiError) throw err;

    logger.error("[AUTH] Unexpected Error", { error: err.message });

    throw ApiError.serviceUnavailable({
      code: "NETWORK_ERROR",
      message: "Tidak dapat terhubung ke layanan autentikasi. Periksa koneksi internet Anda dan coba kembali.",
    });
  }
};

/**
 * Verifikasi JWT token di development environment
 * @param {string} token - JWT access token
 * @returns {Object} Decoded JWT payload berisi userId, email, fullName, role
 * @throws {ApiError} 401 - INVALID_TOKEN - Jika token tidak valid atau expired
 * @private
 */
const verifyJwtToken = (token) => {
  try {
    logger.info("[AUTH] Verify JWT Token (Dev Mode)");

    const decoded = JWT.verifyAccessToken(token);

    logger.info("[AUTH] JWT Token Verified", {
      userId: decoded.userId,
      email: decoded.email,
    });

    return decoded;
  } catch (err) {
    if (err instanceof ApiError) throw err;

    logger.error("[AUTH] JWT Verification Failed", { error: err.message });

    throw ApiError.unauthorized({
      code: "INVALID_TOKEN",
      message: "Token tidak valid atau sudah kadaluarsa. Silakan login kembali.",
    });
  }
};

/**
 * Mendapatkan data user dari database dengan Redis caching
 * Cache TTL: 3600 detik (1 jam)
 * @param {string} email - Email user yang akan dicari
 * @returns {Promise<Object|null>} Data user dari database atau null jika tidak ditemukan
 * @private
 */
const getUserByEmail = async (email) => {
  const cacheKey = `email:${email}`;

  const cached = await userCache.get(cacheKey);
  if (cached) {
    logger.info("[AUTH] User Cache Hit", { email });
    return cached;
  }

  logger.info("[AUTH] Fetch User From Database", { email });
  const user = await userRepo.findByEmail(email);

  if (user) {
    await userCache.set(cacheKey, user, 3600);
    logger.info("[AUTH] User Cached", { email });
  }

  return user;
};

/**
 * Middleware autentikasi utama
 * 
 * Flow autentikasi:
 * - Production: Extract token dari Authorization header → Verifikasi ke Supabase Auth → Cari user di database
 * - Development: Extract token dari Authorization header → Verifikasi JWT token → Cari user di database
 * 
 * Validasi user:
 * - Mengecek status isActive (harus true)
 * - Update isAuthenticated menjadi true jika sebelumnya false
 * - Menambahkan data user ke req.user
 * 
 * @param {import('express').Request} req - Express request object
 * @param {Object} req.headers - Request headers
 * @param {string} req.headers.authorization - Authorization header dengan format "Bearer <token>"
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 * @returns {Promise<void>}
 * 
 * @throws {ApiError} 401 - UNAUTHORIZED - Jika Authorization header tidak ada
 * @throws {ApiError} 401 - INVALID_TOKEN - Jika format token tidak valid (bukan Bearer token)
 * @throws {ApiError} 401 - SESSION_EXPIRED - Jika token JWT Supabase invalid/expired
 * @throws {ApiError} 401 - INVALID_SESSION - Jika user tidak ditemukan di Supabase
 * @throws {ApiError} 401 - USER_NOT_FOUND - Jika email user tidak ditemukan di database
 * @throws {ApiError} 403 - ACCOUNT_INACTIVE - Jika akun user tidak aktif
 * @throws {ApiError} 503 - AUTH_SERVICE_UNAVAILABLE - Jika Supabase mengalami gangguan
 * @throws {ApiError} 503 - NETWORK_ERROR - Jika gagal koneksi ke layanan auth
 * 
 * @example
 * Request dengan token JWT (Development):
 * Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
 * 
 * @example
 * Request dengan token Supabase (Production):
 * Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
 */
const authMiddleware = async (req, res, next) => {
  try {
    logger.info("[AUTH] Incoming Request", {
      method: req.method,
      path: req.originalUrl,
      env: isProd ? "production" : "development",
    });

    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw ApiError.unauthorized({
        code: "UNAUTHORIZED",
        message: "Anda perlu login untuk mengakses halaman ini.",
      });
    }

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    if (!token) {
      throw ApiError.unauthorized({
        code: "INVALID_TOKEN",
        message: "Format token autentikasi tidak valid. Silakan login kembali.",
      });
    }

    let userEmail;

    if (isProd) {
      logger.info("[AUTH] Production Mode - Verify via Supabase");
      const supabaseUser = await getSupabaseUser(token);
      userEmail = supabaseUser.email;
      logger.info("[AUTH] Supabase User Verified", { email: userEmail });
    } else {
      logger.info("[AUTH] Development Mode - Verify via JWT");
      const decoded = verifyJwtToken(token);
      userEmail = decoded.email;
      logger.info("[AUTH] JWT User Verified", {
        userId: decoded.userId,
        email: userEmail,
        role: decoded.role,
      });
    }

    const user = await getUserByEmail(userEmail);

    if (!user) {
      throw ApiError.unauthorized({
        code: "USER_NOT_FOUND",
        message: "Akun tidak ditemukan dalam sistem. Silakan hubungi administrator.",
      });
    }

    if (!user.isActive) {
      throw ApiError.forbidden({
        code: "ACCOUNT_INACTIVE",
        message: "Akun Anda sedang tidak aktif. Silakan hubungi administrator untuk informasi lebih lanjut.",
      });
    }

    if (!user.isAuthenticated) {
      await userRepo.updateAuthStatus(user.id);
      user.isAuthenticated = true;
      logger.info("[AUTH] User Auth Status Updated", {
        userId: user.id,
        email: user.email,
      });
    }

    req.user = user;

    logger.info("[AUTH] Authentication Success", {
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    next();
  } catch (err) {
    logger.error("[AUTH] Authentication Failed", {
      error: err.message,
      code: err.code || null,
      statusCode: err.statusCode || 500,
      path: req.originalUrl,
      method: req.method,
    });

    next(err);
  }
};

export default authMiddleware;