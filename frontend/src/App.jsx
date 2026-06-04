/**
 * App - Root application component.
 *
 * Menginisialisasi dan mengkonfigurasi seluruh aplikasi:
 * - Theme provider dengan mode dark/light dari Redux store
 * - CSS baseline untuk normalisasi style
 * - Router provider dengan konfigurasi routing terpusat
 * - Localization provider untuk date picker (AdapterDayjs)
 * - Auto-scroll ke atas saat navigasi (NavigationScroll)
 * - Global notification handler (snackbar & dialog)
 * - Fetch current user saat aplikasi pertama kali dimuat
 * - Sinkronisasi theme-color meta tag dengan tema aktif
 *
 * @component
 * @returns {JSX.Element} Root aplikasi yang sudah dikonfigurasi
 */
import { useEffect, useMemo } from "react";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { RouterProvider } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import { selectThemeMode } from "@store/theme/themeSelector.js";
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
   * Theme object yang di-memoize berdasarkan mode.
   * Hanya di-recreate saat mode berubah.
   *
   * @type {import("@mui/material").Theme}
   */
  const theme = useMemo(() => getTheme(mode), [mode]);

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
   *
   * Dijalankan setiap kali mode atau theme berubah.
   */
  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    const bg = theme.palette.background.default;
    meta?.setAttribute("content", bg);
    document.documentElement.setAttribute("data-theme", mode);
  }, [mode, theme]);

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