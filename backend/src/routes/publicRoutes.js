import express from "express";

/**
 * ============================================================================
 * CONTROLLERS IMPORT (Alphabetical Order)
 * ============================================================================
 */
import HealthController from "#controller/healthController.js";
import OrderController from "#controller/orderController.js";
import PaymentController from "#controller/paymentController.js";
import ProductController from "#controller/productController.js";
import UserController from "#controller/userController.js";

/**
 * ============================================================================
 * MIDDLEWARE IMPORT
 * ============================================================================
 */
import rateLimiterMiddleware from "#middleware/rateLimiterMiddleware.js";

/**
 * ============================================================================
 * ROUTER INITIALIZATION & CONFIG
 * ============================================================================
 */
const publicRouter = express.Router();
const version = process.env.API_VERSION;
const prefix = `/api/${version}`;

/**
 * ============================================================================
 * RATE LIMITER CONFIGURATIONS
 * ============================================================================
 */
const generalLimiter = rateLimiterMiddleware({ windowMs: 60000, max: 60 });
const strictLimiter = rateLimiterMiddleware({ windowMs: 60000, max: 10 });
const authLimiter = rateLimiterMiddleware({ windowMs: 60000, max: 5 });
const webhookLimiter = rateLimiterMiddleware({ windowMs: 60000, max: 30 });

/**
 * ============================================================================
 * 1. AUTH ROUTES (PUBLIC)
 * ============================================================================
 */

/**
 * @route   POST /api/{version}/auth/login
 * @desc    Login user dengan email untuk mendapatkan JWT token
 * @access  Public
 * @rate    5 requests per minute
 * 
 * @body    { email: string }
 * @returns { success: boolean, message: string, data: { user: Object, tokens: { accessToken, refreshToken } } }
 * 
 * @example
 * POST /api/v1/auth/login
 * Body: { "email": "admin@bengkel.com" }
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Login berhasil",
 *   "data": {
 *     "user": {
 *       "id": "uuid",
 *       "email": "admin@bengkel.com",
 *       "fullName": "Admin User",
 *       "phone": null,
 *       "role": "ADMIN",
 *       "isActive": true,
 *       "isAuthenticated": true,
 *       "createdAt": "2024-01-01T00:00:00.000Z",
 *       "updatedAt": "2024-01-01T00:00:00.000Z"
 *     },
 *     "tokens": {
 *       "accessToken": "eyJhbGciOiJIUzI1NiIs...",
 *       "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
 *     }
 *   }
 * }
 */
publicRouter.post(
  `${prefix}/auth/login`,
  authLimiter,
  UserController.login
);

/**
 * @route   POST /api/{version}/auth/validate/email
 * @desc    Memvalidasi email pengguna untuk keperluan autentikasi (Magic Link/Login)
 * @access  Public
 * @rate    5 requests per minute
 * 
 * @body    { email: string }
 * @returns { success: boolean, message: string, data: { id, email, isActive, isAuthenticated } }
 * 
 * @example
 * POST /api/v1/auth/validate/email
 * Body: { "email": "user@example.com" }
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Email terdaftar, aktif, dan terautentikasi",
 *   "data": {
 *     "id": "uuid",
 *     "email": "user@example.com",
 *     "isActive": true,
 *     "isAuthenticated": true
 *   }
 * }
 */
publicRouter.post(
  `${prefix}/auth/validate/email`,
  authLimiter,
  UserController.validateUserEmail
);

/**
 * ============================================================================
 * 2. HEALTH ROUTES (PUBLIC)
 * ============================================================================
 */

/**
 * @route   GET /api/{version}/health
 * @desc    Memeriksa status kesehatan sistem secara menyeluruh (Database, Redis, Supabase)
 * @access  Public
 * @rate    60 requests per minute
 * 
 * @returns { status: string, timestamp: string, services: Object }
 * 
 * @example
 * GET /api/v1/health
 * 
 * Response:
 * {
 *   "status": "OK",
 *   "timestamp": "2024-01-01T00:00:00.000Z",
 *   "services": {
 *     "database": "connected",
 *     "redis": "connected",
 *     "supabase": "connected"
 *   }
 * }
 */
publicRouter.get(
  `${prefix}/health`,
  generalLimiter,
  HealthController.checkHealth
);

/**
 * ============================================================================
 * 3. ORDERS ROUTES (PUBLIC)
 * ============================================================================
 */

/**
 * @route   GET /api/{version}/orders/:orderNumber/history
 * @desc    Melacak riwayat lengkap pesanan berdasarkan nomor pesanan
 * @desc    (timeline perubahan status dari DRAFT hingga saat ini)
 * @access  Public (Pelanggan)
 * @rate    60 requests per minute
 * 
 * @param   {string} orderNumber - Nomor pesanan
 * @returns { success: boolean, message: string, data: Array }
 * 
 * @example
 * GET /api/v1/orders/INV-2024-001/history
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Riwayat pesanan berhasil diambil",
 *   "data": [
 *     {
 *       "status": "DRAFT",
 *       "timestamp": "2024-01-01T00:00:00.000Z",
 *       "changedBy": "Admin User"
 *     },
 *     ...
 *   ]
 * }
 */
publicRouter.get(
  `${prefix}/orders/:orderNumber/history`,
  generalLimiter,
  OrderController.trackOrderHistory
);

/**
 * ============================================================================
 * 4. PAYMENTS ROUTES (PUBLIC)
 * ============================================================================
 */

/**
 * @route   POST /api/{version}/payments/webhook
 * @desc    Menangani notifikasi webhook dari Midtrans terkait pembaruan status pembayaran
 * @access  Public (Sistem Midtrans)
 * @rate    30 requests per minute
 * 
 * @body    { transaction_id, status_code, ... } - Data dari Midtrans
 * @returns { success: boolean }
 * 
 * @example
 * POST /api/v1/payments/webhook
 * Body: { "transaction_id": "TRX-123", "status_code": "200", ... }
 * 
 * Response:
 * {
 *   "success": true
 * }
 */
publicRouter.post(
  `${prefix}/payments/webhook`,
  webhookLimiter,
  PaymentController.handleMidtransWebhook
);

/**
 * ============================================================================
 * 5. PRODUCTS ROUTES (PUBLIC)
 * ============================================================================
 */

/**
 * @route   GET /api/{version}/products
 * @desc    Mendapatkan daftar semua produk yang tersedia
 * @access  Public
 * @rate    60 requests per minute
 * 
 * @query   { page, limit, search, category, isActive }
 * @returns { success: boolean, message: string, data: Array, metadata: Object }
 * 
 * @example
 * GET /api/v1/products?page=1&limit=10&search=oli
 */
publicRouter.get(
  `${prefix}/products`,
  generalLimiter,
  ProductController.getProducts
);

/**
 * @route   GET /api/{version}/products/services
 * @desc    Mendapatkan daftar produk khusus jenis jasa (layanan perbaikan/servis)
 * @access  Public
 * @rate    60 requests per minute
 * 
 * @query   { page, limit, search }
 * @returns { success: boolean, message: string, data: Array, metadata: Object }
 * 
 * @example
 * GET /api/v1/products/services?page=1&limit=10
 */
publicRouter.get(
  `${prefix}/products/services`,
  generalLimiter,
  ProductController.getServices
);

/**
 * @route   GET /api/{version}/products/spareparts
 * @desc    Mendapatkan daftar produk khusus jenis sparepart (suku cadang)
 * @access  Public
 * @rate    60 requests per minute
 * 
 * @query   { page, limit, search }
 * @returns { success: boolean, message: string, data: Array, metadata: Object }
 * 
 * @example
 * GET /api/v1/products/spareparts?page=1&limit=10
 */
publicRouter.get(
  `${prefix}/products/spareparts`,
  generalLimiter,
  ProductController.getSpareparts
);

/**
 * @route   GET /api/{version}/products/sku/:sku
 * @desc    Mendapatkan detail produk berdasarkan nomor SKU
 * @access  Public
 * @rate    60 requests per minute
 * 
 * @param   {string} sku - Nomor SKU produk
 * @returns { success: boolean, message: string, data: Object }
 * 
 * @example
 * GET /api/v1/products/sku/OLI-001
 */
publicRouter.get(
  `${prefix}/products/sku/:sku`,
  generalLimiter,
  ProductController.getProductBySku
);

/**
 * @route   GET /api/{version}/products/:id
 * @desc    Mendapatkan detail produk berdasarkan ID
 * @access  Public
 * @rate    60 requests per minute
 * 
 * @param   {string} id - ID produk
 * @returns { success: boolean, message: string, data: Object }
 * 
 * @example
 * GET /api/v1/products/uuid-here
 */
publicRouter.get(
  `${prefix}/products/:id`,
  generalLimiter,
  ProductController.getProductById
);

export default publicRouter;