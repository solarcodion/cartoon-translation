// Global Empty State Component

import React from "react";

interface EmptyStateProps {
  /** Icon to display (emoji or React component) */
  icon?: React.ReactNode;
  /** Title text */
  title?: string;
  /** Description text */
  description?: string;
  /** Action button or element */
  action?: React.ReactNode;
  /** Custom className for the container */
  className?: string;
  /** Size variant */
  size?: "sm" | "md" | "lg";
}

export default function EmptyState({
  icon = "📭",
  title = "No data found",
  description,
  action,
  className = "",
  size = "md",
}: EmptyStateProps) {
  // Size configurations
  const sizeConfig = {
    sm: {
      container: "py-8",
      icon: "text-lg mb-2",
      title: "text-sm font-medium",
      description: "text-xs",
      spacing: "space-y-2",
    },
    md: {
      container: "py-12",
      icon: "text-xl mb-2",
      title: "text-base font-medium",
      description: "text-sm",
      spacing: "space-y-3",
    },
    lg: {
      container: "py-16",
      icon: "text-2xl mb-3",
      title: "text-lg font-semibold",
      description: "text-base",
      spacing: "space-y-4",
    },
  };

  const config = sizeConfig[size];

  return (
    <div className={`text-center ${config.container} ${className}`}>
      <div className={config.spacing}>
        {/* Icon */}
        <div className={`text-gray-400 ${config.icon}`}>
          {icon}
        </div>

        {/* Title */}
        <div>
          <h3 className={`text-gray-900 ${config.title}`}>
            {title}
          </h3>
          {description && (
            <p className={`text-gray-600 mt-1 ${config.description}`}>
              {description}
            </p>
          )}
        </div>

        {/* Action */}
        {action && (
          <div className="mt-4">
            {action}
          </div>
        )}
      </div>
    </div>
  );
}

// Convenience components for common use cases
export function NoUsersFound({ className }: { className?: string }) {
  return (
    <EmptyState
      icon="👥"
      title="No users found"
      className={className}
    />
  );
}

export function NoSeriesFound({ className }: { className?: string }) {
  return (
    <EmptyState
      icon="📚"
      title="No series found"
      description="Start by adding your first series"
      className={className}
    />
  );
}

export function NoChaptersFound({ className }: { className?: string }) {
  return (
    <EmptyState
      icon="📖"
      title="No chapters found"
      description="Add chapters to get started"
      className={className}
    />
  );
}

export function NoPagesFound({ className }: { className?: string }) {
  return (
    <EmptyState
      icon="📄"
      title="No pages found"
      description="Upload pages to begin translation"
      className={className}
    />
  );
}

export function NoDataFound({ 
  type, 
  className 
}: { 
  type?: string; 
  className?: string; 
}) {
  return (
    <EmptyState
      icon="📭"
      title={`No ${type || "data"} found`}
      className={className}
    />
  );
}
