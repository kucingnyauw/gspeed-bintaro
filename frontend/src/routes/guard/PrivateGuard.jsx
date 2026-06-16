import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectAuthStatus } from "@store/auth/authSelector.js";

/**
 * Guard component untuk route yang membutuhkan autentikasi.
 * Redirect ke login jika status bukan "auth".
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Children components
 * @returns {JSX.Element} Protected route atau redirect ke login
 */
const PrivateGuard = ({ children }) => {
  const location = useLocation();
  const status = useSelector(selectAuthStatus);

  /**
   * Hanya izinkan akses jika status adalah "auth".
   * Semua status lain (guest, degraded, unknown) akan di-redirect ke login.
   */
  if (status !== "auth") {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default PrivateGuard;