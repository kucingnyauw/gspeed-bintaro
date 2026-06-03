import { lazy } from "react";
import Loadable from "@components/Loadable.jsx";
import MainLayout from "@layout/MainLayout.jsx";

const Homepage = Loadable(lazy(() => import("@views/Homepage.jsx")));
const About = Loadable(lazy(() => import("@views/About.jsx")));
const Products = Loadable(lazy(() => import("@views/Products.jsx")));
const Track = Loadable(lazy(() => import("@views/Track.jsx")));
const Terms = Loadable(lazy(() => import("@views/Terms.jsx")));
const Privacy = Loadable(lazy(() => import("@views/Privacy.jsx")));

const MainRoutes = {
  path: "/",
  element: <MainLayout />,
  children: [
    {
      index: true,
      path: "/",
      element: <Homepage />,
    },
    {
      path: "/about",
      element: <About />,
    },
    {
      path: "/products",
      element: <Products />,
    },
    {
      path: "/track",
      element: <Track />,
    },
    {
      path: "/terms",
      element: <Terms />,
    },
    {
      path: "/privacy",
      element: <Privacy />,
    },
  ],
};

export default MainRoutes;