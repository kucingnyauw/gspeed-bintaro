/**
 * PrivateGuard - Guard component untuk route yang membutuhkan autentikasi.
 *
 * Flow berdasarkan auth status:
 * - unknown: Tampilkan AppLoading (auth check sedang berjalan)
 * - guest: Redirect ke login
 * - auth: Render children (akses diizinkan)
 * - degraded: Render children (akses diizinkan dengan data cache)
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Children components
 * @returns {JSX.Element} Protected route, loader, atau redirect
 */
import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectAuthStatus, selectAuthInitialized } from "@store/auth/authSelector.js";
import { AppLoading } from "@components";

const PrivateGuard = ({ children }) => {
  const location = useLocation();
  const status = useSelector(selectAuthStatus);
  const initialized = useSelector(selectAuthInitialized);

  /**
   * Auth check belum selesai (initial load / refresh token).
   * Tampilkan loader minimal.
   */
  if (status === "unknown" || !initialized) {
    return <AppLoading />;
  }

  /**
   * Tidak ada session valid → redirect ke login.
   */
  if (status === "guest") {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  /**
   * Status "auth" dan "degraded" tetap izinkan akses.
   * - auth: user terautentikasi penuh
   * - degraded: network error tapi masih bisa akses dengan cache
   */
  return children;
};

export default PrivateGuard;