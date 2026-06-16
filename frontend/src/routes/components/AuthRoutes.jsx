import { lazy } from "react";
import { PublicGuard } from "@routes/guard";
import { AppLoadable } from "@components";

/**
 * Lazy-loaded authentication pages.
 * Menggunakan AppLoadable untuk menampilkan loading state
 * saat komponen di-load secara asynchronous.
 */
const Login = AppLoadable(
  lazy(() => import("@views/auth/authentication/Login.jsx"))
);
const Unauthorized = AppLoadable(
  lazy(() => import("@views/auth/authentication/Unauthorized.jsx"))
);
const Callback = AppLoadable(
  lazy(() => import("@views/auth/authentication/Callback.jsx"))
);

/**
 * Konfigurasi routing untuk halaman autentikasi.
 *
 * Route yang tersedia:
 * - `/login`        : Halaman login dengan PublicGuard restricted
 *                     (user yang sudah login akan di-redirect ke dashboard)
 * - `/unauthorized` : Halaman akses ditolak (tidak memerlukan guard)
 * - `/auth/callback`: Callback URL untuk OAuth/SSO authentication flow
 *
 * Catatan:
 * - Route ini diekspor sebagai children tanpa path root.
 *   Pastikan untuk menggabungkannya dengan parent path "/" di konfigurasi router utama,
 *   atau daftarkan langsung dengan path absolut di createBrowserRouter.
 *
 * @type {Object}
 * @property {Array<Object>} children - Daftar route autentikasi
 *
 * @example
 * // Cara 1: Dengan parent path
 * const router = createBrowserRouter([
 *   { path: "/", children: AuthRoutes.children },
 *   MainRoutes,
 * ]);
 *
 * @example
 * // Cara 2: Langsung dengan path absolut
 * const router = createBrowserRouter([
 *   { path: "/login", element: <LoginGuard><Login /></LoginGuard> },
 *   MainRoutes,
 * ]);
 */
const AuthRoutes = {
  path : "/" ,
  children: [
    {
      /**
       * Halaman Login
       *
       * - Dilindungi PublicGuard dengan flag restricted=true
       * - User yang sudah terautentikasi akan di-redirect ke /dashboard
       * - User guest dapat mengakses halaman ini
       *
       * @route GET /login
       */
      path: "login",
      element: (
        <PublicGuard restricted>
          <Login />
        </PublicGuard>
      ),
    },
    {
      /**
       * Halaman Unauthorized (403 Forbidden)
       *
       * - Tidak memerlukan guard khusus
       * - Ditampilkan ketika user mencoba mengakses halaman
       *   yang tidak sesuai dengan role/permission mereka
       * - RoleGuard akan me-redirect ke halaman ini jika role tidak sesuai
       *
       * @route GET /unauthorized
       */
      path: "unauthorized",
      element: <Unauthorized />,
    },
    {
      /**
       * Auth Callback URL
       *
       * - Digunakan untuk menangani response dari OAuth provider (Google, GitHub, dll)
       * - URL ini harus terdaftar di konfigurasi OAuth provider sebagai redirect URI
       * - Format: /auth/callback?access_token=xxx&refresh_token=xxx&...
       * - Komponen Callback akan memproses token dan menyimpannya ke state/auth storage
       * - Setelah sukses, user akan di-redirect ke dashboard atau halaman sebelumnya
       *
       * @route GET /auth/callback
       */
      path: "auth/callback",
      element: <Callback />,
    },
  ],
};

export default AuthRoutes;