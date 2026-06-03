// src/application/socket.js
import { Server } from "socket.io";
import logger from "#app/logger.js";
import ApiError from "#shared/utils/error.js";

let io;

/**
 * Inisialisasi Socket.IO server
 *
 * @param {import("http").Server} server - HTTP server instance
 * @returns {Server} Socket.IO server instance
 *
 * @example
 * import { createServer } from "http";
 * import initSocket from "#application/socket.js";
 *
 * const server = createServer(app);
 * const io = initSocket(server);
 */
const initSocket = (server) => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",").map((o) => o.trim()) || [];

  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        logger.warn("Socket.IO CORS blocked:", { origin });
        return callback(new Error("Not allowed by CORS"));
      },
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    connectTimeout: 45000,
    maxHttpBufferSize: 1e6,
  });

  io.on("connection", (socket) => {
    logger.info("🔌 Client connected:", {
      socketId: socket.id,
      address: socket.handshake.address,
    });

    socket.on("join", (userId) => {
      if (!userId) return;
      socket.join(`user:${userId}`);
      logger.debug("👤 User joined room:", { socketId: socket.id, userId });
    });

    socket.on("leave", (userId) => {
      if (!userId) return;
      socket.leave(`user:${userId}`);
      logger.debug("👋 User left room:", { socketId: socket.id, userId });
    });

    socket.on("disconnect", (reason) => {
      logger.info("🔌 Client disconnected:", { socketId: socket.id, reason });
    });
  });

  io.engine.on("connection_error", (err) => {
    logger.error("❌ Socket.IO connection error:", {
      error: err.message,
      code: err.code,
    });
  });

  logger.info("✅ Socket.IO server initialized");

  return io;
};

/**
 * Mendapatkan instance Socket.IO yang sudah diinisialisasi
 *
 * @returns {Server} Socket.IO server instance
 * @throws {ApiError} 500 - Jika Socket.IO belum diinisialisasi
 */
export const getIO = () => {
  if (!io) {
    throw ApiError.internal({
      message: "Socket.IO belum diinisialisasi. Panggil initSocket() terlebih dahulu.",
      code: "SOCKET_NOT_INITIALIZED",
    });
  }
  return io;
};

export default initSocket;