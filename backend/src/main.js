// src/main.js

/**
 * Load environment variables SEBELUM semua import
 * Ini PENTING karena import dieksekusi saat module load
 */
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envFile = process.env.NODE_ENV === "production"
  ? ".env.production"
  : ".env.development";

dotenv.config({ path: path.resolve(__dirname, "..", envFile) });

/**
 * Import modules setelah dotenv.config()
 */
import http from "http";
import web from "#app/web.js";
import logger from "#app/logger.js";
import initSocket from "#app/io.js";

/**
 * ============================================================
 * Create HTTP Server
 * ============================================================
 */
const server = http.createServer(web);

/**
 * ============================================================
 * Initialize Socket.IO
 * ============================================================
 */
initSocket(server);

/**
 * ============================================================
 * Start Server
 * ============================================================
 */
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  logger.info("=".repeat(50));
  logger.info("🚀 Server is running");
  logger.info(`📍 Port: ${PORT}`);
  logger.info(`📌 Environment: ${process.env.NODE_ENV || "development"}`);
  logger.info(`🔗 URL: http://localhost:${PORT}`);
  logger.info("=".repeat(50));
});