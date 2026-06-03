/**
 * Environment Configuration
 * Mendeteksi environment aplikasi Vite
 * 
 * @module config/env
 * 
 * @example
 * import { isProd, isDev } from "#config/env.js";
 * 
 * if (isDev) {
 *   console.log("Development mode");
 * }
 */

/**
 * Production environment flag
 * @type {boolean}
 */
export const isProd = import.meta.env.VITE_PROD === "production";

/**
 * Development environment flag
 * @type {boolean}
 */
export const isDev = !isProd;
