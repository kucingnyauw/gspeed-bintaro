import { createBrowserRouter } from "react-router-dom";
import {  AuthRoutes, MainRoutes } from "@routes/components";
import ErrorBoundary from "@routes/ErrorBoundary.jsx";

const rootRouter = {
  path: "/",
  errorElement: <ErrorBoundary />,
  children: [
    ...(Array.isArray(AuthRoutes) ? AuthRoutes : [AuthRoutes]),
    ...(Array.isArray(MainRoutes) ? MainRoutes : [MainRoutes]),
  ],
};

const router = createBrowserRouter([rootRouter]);

export default router;