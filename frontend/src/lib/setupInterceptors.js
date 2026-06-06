import Client from "@lib/client.js";
import supabase from "@lib/supabase.js";
import { showNotification } from "@store/notifications/notificationsSlice.js";
import { logger } from "@lib/logger.js";

/**
 * Setup Axios Interceptors untuk request dan response.
 * Menangani auth token, error handling, retry untuk cold start, dan notifikasi.
 *
 * @param {Object} params
 * @param {import("@reduxjs/toolkit").EnhancedStore} params.store - Redux store
 */
export function setupInterceptors({ store }) {
  let isRedirecting = false;

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
        errorCode = response.data.code || response.data.errorCode || errorCode;
        message = response.data.message || message;
        details = response.data.details || null;

        logger.warn("⚠️ Response error:", {
          url: config?.url,
          statusCode,
          errorCode,
          message,
        });
      } else if (error.code === "ECONNABORTED") {
        errorCode = "CONNECTION_ABORTED";
        message =
          "Koneksi terputus secara tiba-tiba. Periksa koneksi internet Anda dan coba kembali.";
        logger.warn("🔌 Connection aborted (ECONNABORTED):", {
          url: config?.url,
          timeout: config?.timeout,
          message: error.message,
        });
      } else if (error.message?.includes("timeout")) {
        errorCode = "REQUEST_TIMEOUT";
        message =
          "Permintaan membutuhkan waktu terlalu lama. Periksa koneksi internet Anda dan coba kembali.";
        logger.warn("⏰ Request timeout:", {
          url: config?.url,
          timeout: config?.timeout,
        });
      } else if (!navigator.onLine) {
        errorCode = "NO_INTERNET_CONNECTION";
        message =
          "Koneksi internet terputus. Periksa jaringan Anda dan coba kembali saat sudah terhubung.";
        logger.warn("📡 Tidak ada koneksi internet");
      } else if (
        error.message?.includes("Network Error") ||
        error.code === "ERR_NETWORK"
      ) {
        errorCode = "SERVER_UNREACHABLE";
        message =
          "Layanan sedang tidak dapat dijangkau. Periksa koneksi internet Anda atau coba beberapa saat lagi.";
        logger.error("🌐 Network error:", {
          url: config?.url,
          code: error.code,
          message: error.message,
        });

        /**
         * RETRY LOGIC untuk Render cold start.
         * Jika server unreachable (cold start), retry dengan exponential backoff.
         */
        if (!config._retryCount || config._retryCount < 2) {
          config._retryCount = (config._retryCount || 0) + 1;
          const delay = Math.min(3000 * 2 ** (config._retryCount - 1), 12000);

          logger.info(
            `🔄 Retry ${config._retryCount}/2 dalam ${delay}ms untuk:`,
            config.url
          );

          await new Promise((resolve) => setTimeout(resolve, delay));
          return Client(config);
        }
      } else if (error.code === "ECONNREFUSED") {
        errorCode = "CONNECTION_REFUSED";
        message =
          "Koneksi ke server ditolak. Server mungkin sedang dalam pemeliharaan. Silakan coba beberapa saat lagi.";
        logger.error("🚫 Connection refused (ECONNREFUSED):", {
          url: config?.url,
          message: error.message,
        });
      } else if (error.code === "ERR_CANCELED") {
        errorCode = "REQUEST_CANCELED";
        message = "Permintaan dibatalkan.";
        logger.debug("🛑 Request canceled:", config?.url);
      }

      if (statusCode === 401 && !isRedirecting) {
        const currentPath = window.location.pathname;

        if (currentPath.includes("/login") || currentPath === "/login") {
          logger.debug("🔒 Already on login page, skipping redirect");
        } else {
          isRedirecting = true;
          logger.warn("🔒 Unauthorized - Redirecting to login");

          try {
            await supabase.auth.signOut();

            const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
            if (projectId) {
              localStorage.removeItem(`sb-${projectId}-auth-token`);
            }

            sessionStorage.setItem("redirectAfterLogin", currentPath);

            setTimeout(() => {
              window.location.href = "/login";
            }, 100);
          } catch (err) {
            logger.error("❌ Error handling 401:", err.message);
            isRedirecting = false;
            window.location.href = "/login";
          }
        }

        return Promise.reject({
          success: false,
          statusCode: 401,
          code: "SESSION_EXPIRED",
          message:
            "Sesi Anda telah berakhir. Silakan masuk kembali untuk melanjutkan.",
          details: null,
        });
      }

      /**
       * Tampilkan notifikasi hanya untuk error yang bukan dari retry.
       */
      const connectionErrors = [
        "NO_INTERNET_CONNECTION",
        "REQUEST_TIMEOUT",
        "CONNECTION_ABORTED",
        "CONNECTION_REFUSED",
        "SERVER_UNREACHABLE",
      ];

      if (
        connectionErrors.includes(errorCode) &&
        !config?.skipErrorNotification &&
        (!config._retryCount || config._retryCount >= 2)
      ) {
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
 * Mendapatkan judul error yang mudah dibaca berdasarkan error code.
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

    case "CONNECTION_ABORTED":
      return "Koneksi Terputus";

    case "CONNECTION_REFUSED":
      return "Server Tidak Tersedia";

    case "SERVER_UNREACHABLE":
      return "Server Tidak Dapat Dijangkau";

    default:
      return "Gangguan Koneksi";
  }
}
