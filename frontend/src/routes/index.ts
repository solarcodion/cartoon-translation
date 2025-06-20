import { type RouteObject } from "react-router-dom";
import Homepage from "../pages/Homepage";
import NotFound from "../pages/NotFound";
import RootLayout from "../components/RootLayout";

export default [
  {
    element: RootLayout(),
    children: [{ index: true, element: Homepage() }],
  },
  { path: "*", element: NotFound() },
] satisfies RouteObject[];
