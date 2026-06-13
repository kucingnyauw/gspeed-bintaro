/**
 * @fileoverview Selector untuk mengakses state tema dari Redux store di Next.js.
 * Menyediakan selector yang sudah dioptimasi untuk performa.
 *
 * @module store/theme/themeSelector
 */

import { createSelector } from "@reduxjs/toolkit";

/**
 * Selector dasar untuk mendapatkan seluruh state tema.
 *
 * @param {Object} state - Root state dari Redux store.
 * @returns {Object} State tema lengkap.
 */
export const selectThemeState = (state) => state.theme;

/**
 * Selector untuk mendapatkan mode tema saat ini.
 *
 * @param {Object} state - Root state dari Redux store.
 * @returns {string} Mode tema ("light" | "dark").
 *
 * @example
 * const mode = useSelector(selectThemeMode);
 */
export const selectThemeMode = (state) => state.theme.mode;

/**
 * Selector memoized untuk mengecek apakah tema saat ini dark mode.
 * Menggunakan createSelector untuk optimasi performa.
 *
 * @type {Function}
 * @returns {boolean} True jika tema saat ini dark mode.
 *
 * @example
 * const isDark = useSelector(selectIsDarkMode);
 */
export const selectIsDarkMode = createSelector(
  selectThemeMode,
  (mode) => mode === "dark"
);

/**
 * Selector memoized untuk mengecek apakah tema saat ini light mode.
 * Menggunakan createSelector untuk optimasi performa.
 *
 * @type {Function}
 * @returns {boolean} True jika tema saat ini light mode.
 *
 * @example
 * const isLight = useSelector(selectIsLightMode);
 */
export const selectIsLightMode = createSelector(
  selectThemeMode,
  (mode) => mode === "light"
);

/**
 * Selector untuk mengecek apakah state tema sudah hydrated.
 * Berguna untuk mencegah flash of wrong theme saat SSR.
 *
 * @param {Object} state - Root state dari Redux store.
 * @returns {boolean} True jika state sudah dihydrate dari localStorage.
 *
 * @example
 * const isHydrated = useSelector(selectIsThemeHydrated);
 */
export const selectIsThemeHydrated = (state) => state.theme.isHydrated;