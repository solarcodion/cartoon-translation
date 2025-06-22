import React from "react";
import { Navigate } from "react-router-dom";
import { useUserProfile } from "../../hooks/useUserProfile";

interface AdminRouteProps {
  children: React.ReactNode;
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const { user, isLoading } = useUserProfile();

  // Show loading state while checking user role
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking permissions...</p>
        </div>
      </div>
    );
  }

  // If user is not admin, redirect to not found page
  if (!user || user.role !== "admin") {
    return <Navigate to="/not-found" replace />;
  }

  // If user is admin, render the protected content
  return <>{children}</>;
}
