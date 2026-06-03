import { logger } from "@lib/logger.js";
import { isDev } from "@config/env.js";

/**
 * Report Web Vitals
 *
 * Mengumpulkan dan melaporkan metrik performa:
 * - CLS  (Cumulative Layout Shift) - Stabilitas visual
 * - FCP  (First Contentful Paint) - Waktu render konten pertama
 * - LCP  (Largest Contentful Paint) - Waktu render konten terbesar
 * - TTFB (Time to First Byte) - Waktu respons server
 * - INP  (Interaction to Next Paint) - Responsivitas interaksi
 *
 * @param {(metric: import("web-vitals").Metric) => void} [onPerfEntry] - Custom callback untuk metrik
 *
 * @example
 * // Default: log ke console di development
 * reportWebVitals();
 *
 * @example
 * // Custom handler
 * reportWebVitals((metric) => {
 *   console.log(metric.name, metric.value);
 * });
 *
 * @example
 * // Kirim ke analytics
 * reportWebVitals(({ name, value, rating }) => {
 *   if (rating === "poor") {
 *     sendToAnalytics({ name, value, rating });
 *   }
 * });
 */
const reportWebVitals = (onPerfEntry) => {
  if (typeof onPerfEntry !== "function") return;

  import("web-vitals").then(({ onCLS, onFCP, onLCP, onTTFB, onINP }) => {
    onCLS(onPerfEntry);
    onFCP(onPerfEntry);
    onLCP(onPerfEntry);
    onTTFB(onPerfEntry);
    onINP(onPerfEntry);
  });
};

/**
 * Report Web Vitals ke logger di development mode
 *
 * @param {import("web-vitals").Metric} metric - Metrik performa
 */
const logWebVitals = (metric) => {
  const { name, value, rating, delta } = metric;

  const ratingEmoji = {
    good: "🟢",
    "needs-improvement": "🟡",
    poor: "🔴",
  };

  const emoji = ratingEmoji[rating] || "⚪";

  logger.debug(`${emoji} [WEB VITALS] ${name}: ${Math.round(value)}ms (${rating}) | delta: ${Math.round(delta)}ms`);
};

/**
 * Default export: report dengan logger di development
 */
export default (onPerfEntry) => {
  if (isDev) {
    reportWebVitals(onPerfEntry || logWebVitals);
  }
};