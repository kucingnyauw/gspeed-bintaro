import { createBrowserRouter } from "react-router-dom";
import { PublicRoutes, AuthRoutes, MainRoutes } from "@routes/components";
import ErrorBoundary from "@routes/ErrorBoundary.jsx";

const rootRouter = {
  path: "/",
  errorElement: <ErrorBoundary />,
  children: [
    ...(Array.isArray(PublicRoutes) ? PublicRoutes : [PublicRoutes]),
    ...(Array.isArray(AuthRoutes) ? AuthRoutes : [AuthRoutes]),
    ...(Array.isArray(MainRoutes) ? MainRoutes : [MainRoutes]),
  ],
};

const router = createBrowserRouter([rootRouter]);

export default router;