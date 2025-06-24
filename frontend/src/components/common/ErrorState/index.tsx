// Global Error State Component

import React from "react";

interface ErrorStateProps {
  /** Error message to display */
  error: string;
  /** Callback function for retry action */
  onRetry?: () => void;
  /** Custom retry button text */
  retryText?: string;
  /** Icon to display (emoji or React component) */
  icon?: React.ReactNode;
  /** Custom className for the container */
  className?: string;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Custom action button instead of retry */
  action?: React.ReactNode;
}

export default function ErrorState({
  error,
  onRetry,
  retryText = "Try Again",
  icon = "⚠️",
  className = "",
  size = "md",
  action,
}: ErrorStateProps) {
  // Size configurations
  const sizeConfig = {
    sm: {
      container: "min-h-[200px] py-8",
      icon: "text-lg mb-2",
      title: "text-sm font-medium",
      description: "text-xs",
      spacing: "space-y-2",
      button: "px-3 py-1.5 text-sm",
    },
    md: {
      container: "min-h-[400px] py-12",
      icon: "text-xl mb-2",
      title: "text-base font-medium",
      description: "text-sm",
      spacing: "space-y-3",
      button: "px-4 py-2 text-sm",
    },
    lg: {
      container: "min-h-[500px] py-16",
      icon: "text-2xl mb-3",
      title: "text-lg font-semibold",
      description: "text-base",
      spacing: "space-y-4",
      button: "px-6 py-3 text-base",
    },
  };

  const config = sizeConfig[size];

  return (
    <div className={`flex items-center justify-center ${config.container} ${className}`}>
      <div className="text-center">
        <div className={config.spacing}>
          {/* Icon */}
          <div className={`text-red-500 ${config.icon}`}>
            {icon}
          </div>

          {/* Error Message */}
          <p className={`text-red-600 ${config.description}`}>
            {error}
          </p>

          {/* Action Button */}
          {action ? (
            <div className="mt-4">
              {action}
            </div>
          ) : onRetry ? (
            <button
              onClick={onRetry}
              className={`${config.button} bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer`}
            >
              {retryText}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// Convenience components for common error scenarios
export function NetworkError({ 
  onRetry, 
  className 
}: { 
  onRetry?: () => void; 
  className?: string; 
}) {
  return (
    <ErrorState
      error="Network error occurred. Please check your connection."
      onRetry={onRetry}
      retryText="Retry"
      className={className}
    />
  );
}

export function LoadingError({ 
  resource, 
  onRetry, 
  className 
}: { 
  resource?: string; 
  onRetry?: () => void; 
  className?: string; 
}) {
  return (
    <ErrorState
      error={`Failed to load ${resource || "data"}. Please try again.`}
      onRetry={onRetry}
      className={className}
    />
  );
}

export function UnexpectedError({ 
  onRetry, 
  className 
}: { 
  onRetry?: () => void; 
  className?: string; 
}) {
  return (
    <ErrorState
      error="An unexpected error occurred."
      onRetry={onRetry}
      className={className}
    />
  );
}
