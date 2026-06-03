// src/application/web.js

/**
 * Konfigurasi Utama Express.js - Bengkel Vespa API
 * Mengatur Middleware, Keamanan, CORS, Routing, dan Error Handling.
 */

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
 * ============================================================
 * Initialize Express
 * ============================================================
 */
const web = express();

web.set("trust proxy", 1);

/**
 * ============================================================
 * Resolve Paths
 * ============================================================
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * ============================================================
 * Swagger Configuration
 * ============================================================
 */
const swaggerPath = path.resolve(__dirname, "../docs/swagger.yml");
const swaggerDocument = YAML.load(swaggerPath);

const version = process.env.API_VERSION || "v1";
const serverUrl = isProd
  ? process.env.APP_URL
  : `http://localhost:${process.env.PORT || 3000}`;

swaggerDocument.servers = [
  {
    url: `${serverUrl}/api/${version}`,
    description: isProd ? "Production Server" : "Development Server",
  },
];

/**
 * ============================================================
 * CORS Configuration
 * ============================================================
 */
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",").map((o) => o.trim()) || [];

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

/**
 * ============================================================
 * Middleware Setup
 * ============================================================
 */
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

/**
 * ============================================================
 * Development: Swagger UI
 * ============================================================
 */
if (!isProd) {
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

  web.get("/", (_req, res) => {
    res.redirect("/docs");
  });
}

/**
 * ============================================================
 * Production: HTTPS Redirect
 * ============================================================
 */
if (isProd) {
  web.use((req, res, next) => {
    if (req.headers["x-forwarded-proto"] !== "https") {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    next();
  });

  web.get("/", (_req, res) => {
    res.status(200).json({
      success: true,
      message: "Bengkel Vespa API",
      version,
      environment: "production",
    });
  });
}

/**
 * ============================================================
 * Routes
 * ============================================================
 */
web.use(publicRouter);
web.use(privateRouter);

/**
 * ============================================================
 * 404 Handler
 * ============================================================
 */
web.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint tidak ditemukan atau tidak tersedia.",
  });
});

/**
 * ============================================================
 * Global Error Handler
 * ============================================================
 */
web.use(errorMiddleware);

export default web;