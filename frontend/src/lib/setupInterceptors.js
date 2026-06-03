import Client from "@lib/client.js";
import supabase from "@lib/supabase.js";
import { showNotification } from "@store/notifications/notificationsSlice.js";
import { logger } from "@lib/logger.js";

/**
 * Setup Axios Interceptors untuk request dan response
 * Menangani auth token, error handling, dan notifikasi
 *
 * @param {Object} params
 * @param {import("@reduxjs/toolkit").EnhancedStore} params.store - Redux store
 */
export function setupInterceptors({ store }) {
  /**
   * Request Interceptor
   * Menambahkan Authorization header dari Supabase session
   */
  Client.interceptors.request.use(
    async (config) => {
      try {
        config.headers = config.headers || {};

        if (config.skipAuth) {
          logger.debug("⏭️ Skip auth for:", config.url);
          return config;
        }

        const { data, error } = await supabase.auth.getSession();

        if (error) {
          logger.warn("⚠️ Gagal mendapatkan session Supabase:", error.message);
          return config;
        }

        const session = data?.session;

        if (session?.access_token) {
          config.headers.Authorization = `Bearer ${session.access_token}`;
          logger.debug("🔑 Token terpasang untuk:", config.url);
        } else {
          logger.debug("🔓 Tanpa token untuk:", config.url);
        }

        return config;
      } catch (err) {
        logger.error("❌ Gagal setup request:", err.message);
        return Promise.reject({
          success: false,
          statusCode: 0,
          code: "REQUEST_SETUP_FAILED",
          message:
            "Gagal menyiapkan permintaan. Silakan muat ulang halaman atau coba beberapa saat lagi.",
          details: null,
        });
      }
    },

    (error) => {
      logger.error("❌ Request interceptor error:", error.message);
      return Promise.reject({
        success: false,
        statusCode: 0,
        code: "REQUEST_FAILED",
        message:
          "Permintaan tidak dapat diproses. Silakan periksa kembali dan coba lagi.",
        details: null,
      });
    }
  );

  /**
   * Response Interceptor
   * Menangani error response, unauthorized, dan network issues
   */
  Client.interceptors.response.use(
    (response) => {
      logger.debug(
        "✅ Response berhasil:",
        response.config.url,
        response.status
      );
      return response.data;
    },

    async (error) => {
      const { response, config } = error;

      let statusCode = 500;
      let errorCode = "UNKNOWN_ERROR";
      let message =
        "Sistem sedang mengalami gangguan. Tim kami sedang menanganinya. Silakan coba beberapa saat lagi.";
      let details = null;

      if (response?.data) {
        statusCode = response.status;
        errorCode = response.data.code || errorCode;
        message = response.data.message || message;
        details = response.data.details || null;

        logger.warn("⚠️ Response error:", {
          url: config?.url,
          statusCode,
          errorCode,
          message,
        });
      } else if (
        error.code === "ECONNABORTED" ||
        error.message?.includes("timeout")
      ) {
        errorCode = "REQUEST_TIMEOUT";
        message =
          "Permintaan membutuhkan waktu terlalu lama. Periksa koneksi internet Anda dan coba kembali.";
        logger.warn("⏰ Request timeout:", config?.url);
      } else if (!navigator.onLine) {
        errorCode = "NO_INTERNET_CONNECTION";
        message =
          "Koneksi internet terputus. Periksa jaringan Anda dan coba kembali saat sudah terhubung.";
        logger.warn("📡 Tidak ada koneksi internet");
      } else if (error.message?.includes("Network Error")) {
        errorCode = "SERVER_UNREACHABLE";
        message =
          "Layanan sedang tidak dapat dijangkau. Periksa koneksi internet Anda atau coba beberapa saat lagi.";
        logger.error("🌐 Network error:", config?.url);
      }

      /**
       * Handle 401 Unauthorized - Session expired atau invalid
       * Redirect ke login jika bukan di halaman login
       */
      if (statusCode === 401 && !window.location.pathname.includes("/login")) {
        logger.warn("🔒 Unauthorized - Redirecting to login");

        try {
          const { data, error: sessionError } =
            await supabase.auth.getSession();

          if (sessionError) {
            logger.error(
              "❌ Session error, signing out:",
              sessionError.message
            );
            await supabase.auth.signOut();
            window.location.replace("/login");
            return Promise.reject({
              success: false,
              statusCode: 401,
              code: "SESSION_EXPIRED",
              message:
                "Sesi Anda telah berakhir. Silakan masuk kembali untuk melanjutkan.",
              details: null,
            });
          }

          const session = data?.session;

          if (!session?.access_token) {
            logger.warn("⚠️ No access token, redirecting to login");
            await supabase.auth.signOut();
            window.location.replace("/login");
          }
        } catch (err) {
          logger.error("❌ Error handling 401:", err.message);
          window.location.replace("/login");
        }
      }

      /**
       * Tampilkan notifikasi error hanya untuk koneksi/network issues
       */
      if (
        errorCode === "NO_INTERNET_CONNECTION" ||
        errorCode === "REQUEST_TIMEOUT"
      ) {
        if (!config?.skipErrorNotification) {
          store.dispatch(
            showNotification({
              title: getErrorTitle(errorCode),
              message,
              type: "error",
              variant: "dialog",
              autoHide: 6000,
            })
          );
        }
      }

      const normalizedError = {
        success: false,
        statusCode,
        code: errorCode,
        message,
        details,
        original: error,
      };

      return Promise.reject(normalizedError);
    }
  );
}

/**
 * Mendapatkan judul error yang mudah dibaca berdasarkan error code
 *
 * @param {string} code - Error code dari response
 * @returns {string} Judul error dalam Bahasa Indonesia
 */
function getErrorTitle(code) {
  switch (code) {
    case "NO_INTERNET_CONNECTION":
      return "Koneksi Terputus";

    case "REQUEST_TIMEOUT":
      return "Waktu Permintaan Habis";

    default:
      return "Gangguan Koneksi";
  }
}
