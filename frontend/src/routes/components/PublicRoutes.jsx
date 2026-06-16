import { lazy } from "react";
import { PublicGuard } from "@routes/guard";
import { AppLoadable } from "@components";

const Onboarding = AppLoadable(
  lazy(() => import("@views/onboarding/pages/OnBoarding.jsx"))
);

const PublicRoutes = {
  path: "/",
  element: (
    <PublicGuard restricted>
      <Onboarding />
    </PublicGuard>
  ),
};

export default PublicRoutes;