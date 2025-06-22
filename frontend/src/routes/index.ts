import { type RouteObject } from "react-router-dom";
import React from "react";
import Homepage from "../pages/Homepage";
import Profile from "../pages/Profile";
import Users from "../pages/Users";
import Series from "../pages/Series";
import Chapters from "../pages/Chapters";
import NotFound from "../pages/NotFound";
import Auth from "../pages/Auth";
import RootLayout from "../components/Layouts/RootLayout";
import ProtectedRoute from "../components/Auth/ProtectedRoute";
import AdminRoute from "../components/Auth/AdminRoute";

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
      {
        path: "series",
        element: React.createElement(Series),
      },
      {
        path: "series/:seriesId/chapters",
        element: React.createElement(Chapters),
      },
      {
        path: "users",
        element: React.createElement(AdminRoute, {
          children: React.createElement(Users),
        }),
      },
    ],
  },
  {
    path: "/auth",
    element: React.createElement(Auth),
  },
  {
    path: "/not-found",
    element: React.createElement(NotFound),
  },
  {
    path: "*",
    element: React.createElement(NotFound),
  },
];

export default routes;
