/**
 * @fileoverview Redux slice untuk mengelola tema aplikasi (dark/light mode) di Next.js.
 * Mendukung Server-Side Rendering (SSR) dan Client-Side Rendering (CSR).
 * Menyediakan state tema yang disinkronisasi dengan localStorage untuk persistensi.
 *
 * @module store/theme/themeSlice
 * @requires @reduxjs/toolkit
 */

import { createSlice } from "@reduxjs/toolkit";

/** @constant {string} */
const THEME_STORAGE_KEY = "theme-mode";

/** @constant {string[]} */
const VALID_THEMES = ["light", "dark"];

/** @constant {string} */
const DEFAULT_THEME = "dark";

/**
 * Memvalidasi apakah nilai tema valid.
 *
 * @param {string} theme - Nilai tema yang akan divalidasi.
 * @returns {boolean} True jika tema valid, false jika tidak.
 */
const isValidTheme = (theme) => VALID_THEMES.includes(theme);

/**
 * Mengambil tema awal dari localStorage.
 * Aman untuk Next.js SSR karena memeriksa keberadaan `window` object.
 * Fallback ke default theme jika dijalankan di server.
 *
 * @returns {string} Tema yang tersimpan di localStorage atau tema default.
 */
const getInitialTheme = () => {
  if (typeof window === "undefined") {
    return DEFAULT_THEME;
  }

  try {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);

    if (storedTheme && isValidTheme(storedTheme)) {
      return storedTheme;
    }

    if (storedTheme) {
      localStorage.removeItem(THEME_STORAGE_KEY);
    }

    return DEFAULT_THEME;
  } catch (error) {
    return DEFAULT_THEME;
  }
};

/**
 * Menyimpan tema ke localStorage dengan aman.
 * Menangani error seperti private browsing, quota exceeded, dll.
 *
 * @param {string} theme - Tema yang akan disimpan.
 * @returns {boolean} True jika berhasil disimpan, false jika gagal.
 */
const saveThemeToStorage = (theme) => {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    return true;
  } catch (error) {
    console.error("Failed to save theme to localStorage:", error);
    return false;
  }
};

/**
 * Slice Redux untuk manajemen tema di Next.js.
 *
 * State shape:
 * ```
 * {
 *   mode: "light" | "dark",
 *   isHydrated: boolean
 * }
 * ```
 *
 * @type {import("@reduxjs/toolkit").Slice}
 */
const themeSlice = createSlice({
  name: "theme",

  /**
   * State awal tema.
   * `isHydrated` digunakan untuk menandai apakah state sudah disinkronisasi
   * dengan localStorage di client-side.
   */
  initialState: {
    /** @type {string} */
    mode: DEFAULT_THEME,
    /** @type {boolean} */
    isHydrated: false,
  },

  reducers: {
    /**
     * Mengatur tema ke mode tertentu.
     * Hanya menerima nilai "light" atau "dark".
     * State hanya diupdate jika nilai valid dan berbeda dari state saat ini.
     *
     * @param {Object} state - State saat ini dari slice tema.
     * @param {Object} action - Action object dari Redux.
     * @param {string} action.payload - Mode tema yang diinginkan.
     */
    setTheme: (state, action) => {
      const newMode = action.payload;

      if (!isValidTheme(newMode)) {
        return;
      }

      if (state.mode === newMode) {
        return;
      }

      state.mode = newMode;

      if (state.isHydrated) {
        saveThemeToStorage(newMode);
      }
    },

    /**
     * Toggle tema antara "light" dan "dark".
     * Jika saat ini "light", akan berubah ke "dark", dan sebaliknya.
     * Perubahan disimpan ke localStorage hanya jika state sudah hydrated.
     *
     * @param {Object} state - State saat ini dari slice tema.
     */
    toggleTheme: (state) => {
      const newMode = state.mode === "light" ? "dark" : "light";
      state.mode = newMode;

      if (state.isHydrated) {
        saveThemeToStorage(newMode);
      }
    },

    /**
     * Menghidrasi state tema dari localStorage.
     * Dipanggil sekali saat aplikasi pertama kali dimuat di client-side.
     * Mencegah flash of wrong theme dengan menyinkronisasi state Redux
     * dengan preferensi yang tersimpan di localStorage.
     *
     * @param {Object} state - State saat ini dari slice tema.
     */
    hydrateTheme: (state) => {
      if (typeof window === "undefined") {
        return;
      }

      const storedTheme = getInitialTheme();

      if (isValidTheme(storedTheme)) {
        state.mode = storedTheme;
      }

      state.isHydrated = true;
    },
  },
});

/**
 * Action creator untuk mengatur tema ke mode tertentu.
 *
 * @function setTheme
 * @param {string} mode - Mode tema ("light" | "dark").
 * @returns {Object} Action object dengan payload mode.
 *
 * @example
 * dispatch(setTheme("light"));
 */
export const { setTheme } = themeSlice.actions;

/**
 * Action creator untuk toggle tema antara light dan dark.
 *
 * @function toggleTheme
 * @returns {Object} Action object tanpa payload.
 *
 * @example
 * dispatch(toggleTheme());
 */
export const { toggleTheme } = themeSlice.actions;

/**
 * Action creator untuk menghidrasi state tema dari localStorage.
 * Harus dipanggil di client component saat pertama kali mount.
 *
 * @function hydrateTheme
 * @returns {Object} Action object tanpa payload.
 *
 * @example
 * useEffect(() => {
 *   dispatch(hydrateTheme());
 * }, []);
 */
export const { hydrateTheme } = themeSlice.actions;

/**
 * Reducer tema untuk digunakan di store.
 *
 * @type {Function}
 */
export default themeSlice.reducer;