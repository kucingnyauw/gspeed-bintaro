/**
 * PublicGuard - Guard component untuk route publik (login, register, onboarding, dll).
 *
 * Flow berdasarkan auth status:
 * - unknown / !initialized: Render children (jangan block, biar auth check selesai)
 * - guest: Render children (akses publik normal)
 * - auth + restricted: Redirect ke /dashboard (user sudah login, tidak perlu akses login lagi)
 * - auth + !restricted: Render children (akses publik untuk user login)
 * - degraded: Render children (jangan block, user tetap bisa akses)
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Children components
 * @param {boolean} [props.restricted=false] - Jika true, authenticated user di-redirect ke /dashboard
 * @returns {JSX.Element} Public route atau redirect
 *
 * @example
 * <PublicGuard restricted>
 *   <Login />
 * </PublicGuard>
 */
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectAuthStatus, selectAuthInitialized } from "@store/auth/authSelector.js";

const PublicGuard = ({ children, restricted = false }) => {
  const status = useSelector(selectAuthStatus);
  const initialized = useSelector(selectAuthInitialized);

  /**
   * Hanya redirect jika:
   * 1. Auth sudah diinisialisasi (bukan initial load)
   * 2. User sudah terautentikasi
   * 3. Route ini restricted (seperti login/register)
   *
   * Jika auth belum diinisialisasi, biarkan render children dulu.
   * Ini mencegah redirect race condition saat initial load.
   */
  if (initialized && status === "auth" && restricted) {
    return <Navigate to="/dashboard" replace />;
  }

  /**
   * Semua state lain: render children.
   * - unknown: auth check belum selesai
   * - guest: user belum login
   * - degraded: network error
   * - auth + !restricted: user login akses halaman publik biasa
   */
  return children;
};

export default PublicGuard;