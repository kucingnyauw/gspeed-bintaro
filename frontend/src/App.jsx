/**
 * App - Root application component.
 *
 * Menginisialisasi dan mengkonfigurasi seluruh aplikasi:
 * - Theme provider dengan mode dark/light dari Redux store
 * - CSS baseline untuk normalisasi style
 * - Router provider dengan konfigurasi routing terpusat
 * - Localization provider untuk date picker (AdapterDayjs)
 * - Global notification handler (snackbar & dialog)
 * - Fetch current user saat aplikasi pertama kali dimuat
 * - Sinkronisasi theme-color meta tag dengan tema aktif
 * - Hidrasi tema dari localStorage saat aplikasi dimuat
 * - Force repaint untuk memastikan tema berubah secara visual
 *
 * @component
 * @returns {JSX.Element} Root aplikasi yang sudah dikonfigurasi
 *
 * @example
 * ReactDOM.createRoot(document.getElementById("root")).render(
 *   <Provider store={store}>
 *     <App />
 *   </Provider>
 * );
 */
import { useEffect, useMemo } from "react";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { RouterProvider } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import {
  selectThemeMode,
  selectIsThemeHydrated,
} from "@store/theme/themeSelector.js";
import { hydrateTheme } from "@store/theme/themeSlices.js";
import { getTheme } from "@styles/Theme.jsx";
import { fetchCurrentUser } from "@store/auth/authThunk.js";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { NotificationHandler } from "@components";
import router from "@routes";


const App = () => {
  const dispatch = useDispatch();

  /**
   * Mode tema saat ini dari Redux store.
   * Nilai: "light" atau "dark".
   *
   * @type {string}
   */
  const mode = useSelector(selectThemeMode);

  /**
   * Status hidrasi tema.
   * Menandakan apakah state tema sudah disinkronisasi dengan localStorage.
   *
   * @type {boolean}
   */
  const isHydrated = useSelector(selectIsThemeHydrated);

  /**
   * Theme object yang di-memoize berdasarkan mode.
   * Hanya di-recreate saat mode berubah.
   *
   * @type {import("@mui/material").Theme}
   */
  const theme = useMemo(() => getTheme(mode), [mode]);

  /**
   * Effect: Hidrasi tema dari localStorage saat aplikasi pertama kali dimuat.
   * Memastikan state Redux sinkron dengan preferensi yang tersimpan.
   */
  useEffect(() => {
    dispatch(hydrateTheme());
  }, [dispatch]);

  /**
   * Effect: Fetch data current user saat aplikasi pertama kali dimuat.
   * Dipanggil sekali karena dependency [dispatch] tidak berubah.
   */
  useEffect(() => {
    dispatch(fetchCurrentUser());
  }, [dispatch]);

  /**
   * Effect: Sinkronisasi theme-color meta tag dan data attribute.
   *
   * - Mengupdate `<meta name="theme-color">` dengan warna background tema
   * - Mengatur `data-theme` attribute pada `<html>` untuk CSS custom properties
   * - Menambahkan class `dark-mode` atau `light-mode` pada root element
   * - Melakukan force repaint untuk memastikan tema berubah secara visual
   *
   * Hanya dijalankan setelah state hydrated untuk mencegah flash of wrong theme.
   * Dijalankan setiap kali mode atau theme berubah.
   */
  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const meta = document.querySelector('meta[name="theme-color"]');

    if (meta) {
      const bg = theme.palette.background.default;
      meta.setAttribute("content", bg);
    }

    const root = document.documentElement;
    root.setAttribute("data-theme", mode);

    if (mode === "dark") {
      root.classList.add("dark-mode");
      root.classList.remove("light-mode");
    } else {
      root.classList.add("light-mode");
      root.classList.remove("dark-mode");
    }

    /**
     * Force repaint untuk memastikan tema berubah.
     * Mengatasi masalah browser yang tidak langsung menerapkan perubahan tema.
     */
    document.body.style.display = "none";
    document.body.offsetHeight;
    document.body.style.display = "";
  }, [mode, theme, isHydrated]);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <NotificationHandler />
        <RouterProvider router={router} />
      </ThemeProvider>
    </LocalizationProvider>
  );
};

export default App;