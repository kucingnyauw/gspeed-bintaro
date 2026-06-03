// src/config/env.js

/**
 * Environment Configuration
 * 
 * @module config/env
 */

/**
 * Production environment flag
 * @type {boolean}
 */
export const isProd = process.env.NODE_ENV === "production";

/**
 * Development environment flag
 * @type {boolean}
 */
export const isDev = !isProd;

/**
 * Test environment flag
 * @type {boolean}
 */
export const isTest = process.env.NODE_ENV === "test";

