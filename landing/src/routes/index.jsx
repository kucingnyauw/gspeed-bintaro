import { createBrowserRouter } from "react-router-dom";
import MainRoutes from "@routes/MainRoutes.jsx";
import ErrorBoundary from "@routes/ErrorBoundary.jsx";

/**
 * Objek rute utama (root) yang menampung seluruh konfigurasi rute aplikasi.
 * Pengecekan Array.isArray digunakan untuk memastikan MainRoutes 
 * dapat di-spread (diekstrak) dengan aman ke dalam array children, 
 * baik jika formatnya berupa objek tunggal maupun array.
 *
 * @constant
 * @type {Object}
 */
const route = {
  path: "/",
  errorElement : <ErrorBoundary/>,
  children: [
    ...(Array.isArray(MainRoutes) ? MainRoutes : [MainRoutes])
  ]
};

/**
 * Inisialisasi router utama aplikasi yang mengelola navigasi DOM.
 * Fungsi createBrowserRouter selalu menerima parameter berbentuk array.
 *
 * @constant
 * @type {import("@remix-run/router").Router}
 */
const routes = createBrowserRouter([route]);

export default routes;