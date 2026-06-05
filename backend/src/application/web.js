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

/**
 * Mempercayai proxy headers (diperlukan untuk production di belakang reverse proxy).
 */
web.set("trust proxy", 1);

/**
 * Resolve path file dan direktori saat ini.
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Versi API yang sedang berjalan.
 * 
 * @constant {string}
 */
const version = process.env.API_VERSION || "v1";

/**
 * Base URL aplikasi.
 * 
 * @constant {string}
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
 * Daftar origin yang diizinkan untuk mengakses API.
 * Diambil dari environment variable ALLOWED_ORIGINS.
 * 
 * @constant {string[]}
 */
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",").map((o) => o.trim()) || [];

/**
 * Konfigurasi CORS.
 * 
 * @constant {cors.CorsOptions}
 */
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }
    
    if (!isProd) {
      return callback(null, true);
    }

    if (allowedOrigins.length === 0) {
      return callback(null, true);
    }

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
    "X-CSRF-Token",
  ],
  exposedHeaders: [
    "Content-Length",
    "X-Request-Id",
    "Set-Cookie",
  ],
  optionsSuccessStatus: 204,
  preflightContinue: false,
  maxAge: 86400,
};

/**
 * CORS middleware - harus di-apply sebelum middleware lain.
 * 
 * Catatan: `cors(corsOptions)` sudah otomatis menangani OPTIONS preflight.
 * Tidak perlu menambahkan `web.options()` terpisah.
 */
web.use(cors(corsOptions));

/**
 * Helmet security headers dengan konfigurasi yang kompatibel dengan CORS.
 */
web.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    contentSecurityPolicy: isProd ? undefined : false,
    crossOriginEmbedderPolicy: false,
  })
);

/**
 * Compression middleware untuk response body.
 */
web.use(compression());

/**
 * JSON body parser dengan limit 1MB.
 */
web.use(express.json({ limit: "1mb" }));

/**
 * URL-encoded body parser dengan limit 1MB.
 */
web.use(express.urlencoded({ extended: true, limit: "1mb" }));

/**
 * HTTP request logger.
 */
web.use(morgan(isProd ? "combined" : "dev"));

/**
 * Swagger UI documentation endpoint.
 */
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
 * Root endpoint.
 * Di production mengembalikan JSON, di development redirect ke /docs.
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

/**
 * HTTPS Redirect middleware untuk production.
 * Redirect semua HTTP request ke HTTPS.
 */
if (isProd) {
  web.use((req, res, next) => {
    if (req.headers["x-forwarded-proto"] !== "https") {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    next();
  });
}

/**
 * Public routes - tidak memerlukan autentikasi.
 */
web.use(publicRouter);

/**
 * Private routes - memerlukan autentikasi.
 */
web.use(privateRouter);

/**
 * Global 404 handler.
 * Di-trigger ketika tidak ada route yang match.
 */
web.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint tidak ditemukan atau tidak tersedia.",
  });
});

/**
 * Global error handler middleware.
 * Harus diletakkan paling akhir setelah semua route dan middleware.
 */
web.use(errorMiddleware);

export default web;