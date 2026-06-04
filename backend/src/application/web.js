import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import compression from "compression";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import path from "path";
import { fileURLToPath } from "url";
import privateRouter from "#routes/privateRoutes.js";
import publicRouter from "#routes/publicRoutes.js";
import { errorMiddleware } from "#middleware/errorMiddleware.js";
import { isProd } from "#config/env.js";

/**
 * Instance utama Express.js untuk aplikasi Bengkel Vespa API.
 * 
 * @constant {express.Application}
 */
const web = express();

web.set("trust proxy", 1);

/**
 * Resolve path file dan direktori saat ini untuk keperluan loading file statis.
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Versi API yang sedang berjalan.
 * 
 * @constant {string}
 * @default "v1"
 */
const version = process.env.API_VERSION || "v1";

/**
 * Base URL aplikasi yang digunakan untuk dokumentasi Swagger dan response.
 * Di production menggunakan APP_URL, di development fallback ke localhost.
 * 
 * @constant {string}
 * @example
 * // Production
 * "https://api.bengkel-vespa.com"
 * 
 * @example
 * // Development
 * "http://localhost:3000"
 */
const appUrl = process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`;

/**
 * Path ke file dokumentasi Swagger YAML.
 * 
 * @constant {string}
 */
const swaggerPath = path.resolve(__dirname, "../docs/swagger.yml");

/**
 * Dokumen Swagger yang sudah di-parse dari file YAML.
 * 
 * @constant {Object}
 */
const swaggerDocument = YAML.load(swaggerPath);

swaggerDocument.servers = [
  {
    url: `${appUrl}/api/${version}`,
    description: isProd ? "Production Server" : "Development Server",
  },
];

/**
 * Daftar origin yang diizinkan untuk mengakses API di production.
 * Dipisahkan dengan koma dari environment variable ALLOWED_ORIGINS.
 * 
 * @constant {string[]}
 * @example
 * ["https://bengkel-vespa.com", "https://admin.bengkel-vespa.com"]
 */
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",").map((o) => o.trim()) || [];

/**
 * Konfigurasi CORS untuk mengontrol akses dari origin yang berbeda.
 * 
 * Di development: semua origin diizinkan.
 * Di production: hanya origin yang terdaftar di ALLOWED_ORIGINS yang diizinkan.
 * 
 * @constant {cors.CorsOptions}
 * 
 * @property {Function} origin - Callback untuk validasi origin request
 * @property {boolean} credentials - Mengizinkan pengiriman cookies dan header authorization
 * @property {string[]} methods - HTTP methods yang diizinkan
 * @property {string[]} allowedHeaders - Header yang diizinkan dari client
 * @property {string[]} exposedHeaders - Header yang bisa diakses oleh client
 * @property {number} optionsSuccessStatus - Status code untuk successful OPTIONS request
 * @property {boolean} preflightContinue - Apakah preflight request diteruskan ke route handler
 * @property {number} maxAge - Cache duration untuk preflight request (24 jam)
 */
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    
    if (!isProd) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
    "Referer",
    "User-Agent",
  ],
  exposedHeaders: ["set-cookie", "Authorization"],
  optionsSuccessStatus: 200,
  preflightContinue: false,
  maxAge: 86400,
};

web.use(cors(corsOptions));
web.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  })
);
web.use(compression());
web.use(express.json({ limit: "1mb" }));
web.use(express.urlencoded({ extended: true, limit: "1mb" }));
web.use(morgan(isProd ? "combined" : "dev"));

web.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Bengkel Vespa API Docs",
    customfavIcon: "/favicon.ico",
    swaggerOptions: {
      tryItOutEnabled: true,
      filter: true,
      displayRequestDuration: true,
    },
  })
);

/**
 * Root endpoint yang menampilkan informasi API.
 * 
 * Di production: mengembalikan JSON dengan informasi API dan link dokumentasi.
 * Di development: redirect ke halaman dokumentasi Swagger UI.
 * 
 * @name GET /
 * @function
 * 
 * @example
 * // Production Response
 * {
 *   "success": true,
 *   "message": "Bengkel Vespa API",
 *   "version": "v1",
 *   "environment": "production",
 *   "docs": "https://api.bengkel-vespa.com/docs"
 * }
 */
web.get("/", (_req, res) => {
  if (isProd) {
    return res.status(200).json({
      success: true,
      message: "Bengkel Vespa API",
      version,
      environment: "production",
      docs: `${appUrl}/docs`,
    });
  }

  return res.redirect("/docs");
});

if (isProd) {
  /**
   * Middleware untuk memaksa redirect HTTP ke HTTPS di production.
   * Mengecek header x-forwarded-proto dari reverse proxy (Nginx, etc).
   * 
   * @name HTTPS Redirect
   * @function
   */
  web.use((req, res, next) => {
    if (req.headers["x-forwarded-proto"] !== "https") {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    next();
  });
}

web.use(publicRouter);
web.use(privateRouter);

/**
 * Global 404 handler untuk endpoint yang tidak ditemukan.
 * 
 * @name 404 Handler
 * @function
 * 
 * @example
 * // Response
 * {
 *   "success": false,
 *   "message": "Endpoint tidak ditemukan atau tidak tersedia."
 * }
 */
web.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint tidak ditemukan atau tidak tersedia.",
  });
});

web.use(errorMiddleware);

export default web;