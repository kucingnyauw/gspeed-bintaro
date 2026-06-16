import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectUser, selectAuthStatus } from "@store/auth/authSelector.js";

/**
 * Guard component untuk route berdasarkan role user.
 * Redirect ke /unauthorized jika role tidak diizinkan.
 *
 * @param {Object} props
 * @param {string[]} [props.allowedRoles=[]] - Array role yang diizinkan
 * @param {React.ReactNode} props.children - Children components
 * @returns {JSX.Element|null} Role-protected route atau redirect
 */
const RoleGuard = ({ allowedRoles = [], children }) => {
  const user = useSelector(selectUser);
  const status = useSelector(selectAuthStatus);

  if (status !== "auth") {
    return null;
  }

  const hasAccess = allowedRoles.includes(user?.role);

  if (!hasAccess) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default RoleGuard;