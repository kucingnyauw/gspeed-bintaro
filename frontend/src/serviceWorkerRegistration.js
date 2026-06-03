import { logger } from "@lib/logger.js";
import { isProd } from "@config/env.js";

/**
 * Service Worker Registration
 *
 * Responsibilities:
 * - Register service worker di production
 * - Handle update lifecycle
 * - Provide hooks untuk UI integration
 *
 * @module serviceWorkerRegistration
 */

const isLocalhost =
  ["localhost", "[::1]"].includes(window.location.hostname) ||
  /^127(\.\d{1,3}){3}$/.test(window.location.hostname);

/**
 * Register Service Worker
 *
 * @param {Object} [config]
 * @param {(reg: ServiceWorkerRegistration) => void} [config.onSuccess] - Callback saat SW berhasil diinstal
 * @param {(reg: ServiceWorkerRegistration) => void} [config.onUpdate] - Callback saat update tersedia
 *
 * @example
 * register({
 *   onSuccess: (reg) => console.log("SW installed"),
 *   onUpdate: (reg) => showUpdateNotification(reg)
 * });
 */
export function register(config) {
  if (!isProd || !("serviceWorker" in navigator)) {
    logger.debug("🔧 Service Worker: Skipped (dev mode atau tidak didukung)");
    return;
  }

  window.addEventListener("load", () => {
    const swUrl = `${import.meta.env.BASE_URL}service-worker.js`;

    if (isLocalhost) {
      logger.debug("🏠 Service Worker: Localhost mode");
      checkValidServiceWorker(swUrl, config);
    } else {
      logger.debug("🌐 Service Worker: Production mode");
      registerValidSW(swUrl, config);
    }
  });
}

/**
 * Register valid Service Worker
 *
 * @param {string} swUrl - URL service worker
 * @param {Object} [config] - Callback config
 */
function registerValidSW(swUrl, config) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      logger.info("✅ [SW] Registered successfully");

      registration.onupdatefound = () => {
        const worker = registration.installing;
        if (!worker) return;

        worker.onstatechange = () => {
          if (worker.state === "installed") {
            if (navigator.serviceWorker.controller) {
              logger.info("🔄 [SW] Update available - ready to refresh");

              config?.onUpdate?.(registration);
            } else {
              logger.info("📦 [SW] Content cached for offline use");

              config?.onSuccess?.(registration);
            }
          }
        };
      };
    })
    .catch((err) => {
      logger.error("❌ [SW] Registration failed:", err.message);
    });
}

/**
 * Validasi Service Worker di localhost
 *
 * @param {string} swUrl - URL service worker
 * @param {Object} [config] - Callback config
 */
function checkValidServiceWorker(swUrl, config) {
  fetch(swUrl, { headers: { "Service-Worker": "script" } })
    .then((res) => {
      const contentType = res.headers.get("content-type");

      if (
        res.status === 404 ||
        (contentType && !contentType.includes("javascript"))
      ) {
        logger.warn("⚠️ [SW] Invalid service worker, unregistering...");

        navigator.serviceWorker.ready.then((reg) => {
          reg.unregister().then(() => {
            logger.info("🔄 [SW] Unregistered, reloading page");
            location.reload();
          });
        });
      } else {
        logger.debug("✅ [SW] Valid, registering...");
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      logger.warn("📡 [SW] Offline mode - running without service worker");
    });
}

/**
 * Unregister Service Worker
 *
 * @example
 * unregister();
 */
export function unregister() {
  if (!("serviceWorker" in navigator)) {
    logger.debug("🔧 Service Worker: Not supported");
    return;
  }

  navigator.serviceWorker.ready
    .then((reg) => {
      logger.info("🗑️ [SW] Unregistering...");
      return reg.unregister();
    })
    .then(() => {
      logger.info("✅ [SW] Unregistered successfully");
    })
    .catch((err) => {
      logger.error("❌ [SW] Unregister failed:", err.message);
    });
}