import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import { RouterProvider } from "react-router-dom";
import theme from "@styles/Theme.jsx";
import routes from "@routes/index.jsx";

/**
 * Komponen utama aplikasi yang menjadi pembungkus tingkat atas (root).
 * Menyediakan tema kustom Material UI, standarisasi CSS (CssBaseline),
 * dan mendistribusikan konfigurasi routing menggunakan RouterProvider.
 *
 * @returns {JSX.Element} Elemen root aplikasi
 */
function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RouterProvider router={routes} />
    </ThemeProvider>
  );
}

export default App;