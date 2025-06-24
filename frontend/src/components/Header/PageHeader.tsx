// Reusable Page Header Component

import React from "react";

interface PageHeaderProps {
  /** Main title of the page */
  title: string;
  /** Optional subtitle/description */
  subtitle?: string;
  /** Action button element (optional) */
  action?: React.ReactNode;
  /** Whether to use responsive layout for mobile */
  responsive?: boolean;
  /** Custom className for the container */
  className?: string;
  /** Whether to use card styling with background and border */
  card?: boolean;
}

export default function PageHeader({
  title,
  subtitle,
  action,
  responsive = false,
  className = "",
  card = false,
}: PageHeaderProps) {
  // Base container classes
  const containerClasses = [
    responsive 
      ? "flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      : "flex items-center justify-between",
    card ? "bg-white border border-gray-200 rounded-lg p-6 shadow-sm" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  // Title size classes based on whether it's in a card or not
  const titleClasses = card 
    ? "text-3xl font-bold text-gray-900"
    : responsive 
      ? "text-2xl sm:text-3xl font-bold text-gray-900"
      : "text-2xl font-bold text-gray-900";

  return (
    <div className={containerClasses}>
      <div className={card ? "space-y-2" : ""}>
        <h1 className={titleClasses}>{title}</h1>
        {subtitle && (
          <p className="text-gray-600">{subtitle}</p>
        )}
      </div>
      {action && (
        <div className={responsive ? "w-full sm:w-auto" : ""}>
          {action}
        </div>
      )}
    </div>
  );
}

// Convenience components for common patterns
export function SimplePageHeader({ 
  title, 
  action 
}: { 
  title: string; 
  action?: React.ReactNode; 
}) {
  return <PageHeader title={title} action={action} />;
}

export function ResponsivePageHeader({ 
  title, 
  subtitle, 
  action 
}: { 
  title: string; 
  subtitle?: string; 
  action?: React.ReactNode; 
}) {
  return (
    <PageHeader 
      title={title} 
      subtitle={subtitle} 
      action={action} 
      responsive 
    />
  );
}

export function CardPageHeader({ 
  title, 
  subtitle, 
  action 
}: { 
  title: string; 
  subtitle?: string; 
  action?: React.ReactNode; 
}) {
  return (
    <PageHeader 
      title={title} 
      subtitle={subtitle} 
      action={action} 
      card 
    />
  );
}
