import { type RouteObject } from "react-router-dom";
import React from "react";
import Homepage from "../pages/Homepage";
import Profile from "../pages/Profile";
import NotFound from "../pages/NotFound";
import Auth from "../pages/Auth";
import RootLayout from "../components/Layouts/RootLayout";
import ProtectedRoute from "../components/Auth/ProtectedRoute";

const routes: RouteObject[] = [
  {
    path: "/",
    element: React.createElement(ProtectedRoute, {
      children: React.createElement(RootLayout),
    }),
    children: [
      {
        index: true,
        element: React.createElement(Homepage),
      },
      {
        path: "profile",
        element: React.createElement(Profile),
      },
    ],
  },
  {
    path: "/auth",
    element: React.createElement(Auth),
  },
  {
    path: "*",
    element: React.createElement(NotFound),
  },
];

export default routes;
