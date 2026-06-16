import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectAuthStatus } from "@store/auth/authSelector.js";

/**
 * Guard component untuk route publik (login, register, onboarding, dll).
 *
 * Menangani tiga kemungkinan status autentikasi:
 * - unknown/loading: Render children tanpa redirect. Route publik
 *   dapat diakses meskipun status autentikasi belum ditentukan
 *   untuk menghindari blocking saat initial load.
 * - auth + restricted: Redirect authenticated user ke halaman utama
 *   jika route memiliki flag restricted (contoh: user yang sudah login
 *   tidak perlu mengakses halaman login lagi).
 * - guest / auth + not restricted: Render children secara normal.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Children components
 * @param {boolean} [props.restricted=false] - Jika true, authenticated user
 *   akan di-redirect ke /dashboard
 * @returns {JSX.Element} Public route atau redirect ke /dashboard
 *
 * @example
 * <Route
 *   path="/login"
 *   element={
 *     <PublicGuard restricted>
 *       <Login />
 *     </PublicGuard>
 *   }
 * />
 */
const PublicGuard = ({ children, restricted = false }) => {
  const status = useSelector(selectAuthStatus);
  const isAuthenticated = status === "auth";

  console.log("status" , status);

  if (isAuthenticated && restricted) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default PublicGuard;