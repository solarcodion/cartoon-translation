import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { PageLoadingSpinner } from "../common/LoadingSpinner";

interface AdminRouteProps {
  children: React.ReactNode;
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const { user, isLoading } = useAuth();

  // Show loading state while checking user role
  if (isLoading) {
    return <PageLoadingSpinner text="Checking permissions..." />;
  }

  // If user is not admin, redirect to not found page
  if (!user || user.role !== "admin") {
    return <Navigate to="/not-found" replace />;
  }

  // If user is admin, render the protected content
  return <>{children}</>;
}
