import { type RouteObject } from "react-router-dom";
import React from "react";
import Homepage from "../pages/Homepage";
import NotFound from "../pages/NotFound";
import RootLayout from "../components/Layouts/RootLayout";

const routes: RouteObject[] = [
  {
    path: "/",
    element: React.createElement(RootLayout),
    children: [
      {
        index: true,
        element: React.createElement(Homepage),
      },
    ],
  },
  {
    path: "*",
    element: React.createElement(NotFound),
  },
];

export default routes;
