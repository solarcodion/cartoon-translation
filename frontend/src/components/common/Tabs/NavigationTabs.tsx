// Global Navigation Tabs Component

import React from "react";

export interface TabItem {
  /** Unique identifier for the tab */
  id: string;
  /** Display label for the tab */
  label: string;
  /** Icon component to display */
  icon?: React.ReactNode;
  /** Whether the tab is disabled */
  disabled?: boolean;
  /** Badge count to display */
  badge?: number | string;
}

interface NavigationTabsProps {
  /** Array of tab items */
  tabs: TabItem[];
  /** Currently active tab ID */
  activeTab: string;
  /** Callback when tab is clicked */
  onTabChange: (tabId: string) => void;
  /** Custom className for the container */
  className?: string;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Style variant */
  variant?: "default" | "pills" | "underline";
  /** Whether tabs should be full width */
  fullWidth?: boolean;
}

export default function NavigationTabs({
  tabs,
  activeTab,
  onTabChange,
  className = "",
  size = "md",
  variant = "default",
  fullWidth = true,
}: NavigationTabsProps) {
  // Size configurations
  const sizeConfig = {
    sm: "px-4 py-2 text-sm gap-1",
    md: "px-6 py-4 text-sm gap-2",
    lg: "px-8 py-5 text-base gap-3",
  };

  // Variant configurations
  const variantConfig = {
    default: {
      container:
        "bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden",
      tab: "border-r border-gray-200 last:border-r-0",
      active: "bg-gray-50 text-gray-900 font-medium",
      inactive:
        "bg-white text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors",
    },
    pills: {
      container: "bg-gray-100 p-1 rounded-lg",
      tab: "rounded-md mx-0.5 first:ml-0 last:mr-0",
      active: "bg-white text-gray-900 font-medium shadow-sm",
      inactive:
        "text-gray-600 hover:text-gray-900 hover:bg-white/50 transition-colors",
    },
    underline: {
      container: "border-b border-gray-200",
      tab: "border-b-2 border-transparent",
      active: "border-blue-500 text-blue-600 font-medium",
      inactive:
        "text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors",
    },
  };

  const config = variantConfig[variant];

  return (
    <div className={`w-full ${config.container} ${className}`}>
      <div className={`flex ${fullWidth ? "w-full" : ""}`}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && onTabChange(tab.id)}
            disabled={tab.disabled}
            className={`
              ${fullWidth ? "flex-1" : ""} 
              flex items-center justify-center
              ${sizeConfig[size]}
              ${config.tab}
              ${activeTab === tab.id ? config.active : config.inactive}
              ${
                tab.disabled
                  ? "opacity-50 cursor-not-allowed"
                  : "cursor-pointer"
              }
            `.trim()}
          >
            {tab.icon && <span className="text-current">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge && (
              <span className="ml-2 px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded-full">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// Tab Content Container Component
interface TabContentProps {
  /** Currently active tab ID */
  activeTab: string;
  /** Tab ID this content belongs to */
  tabId: string;
  /** Content to display */
  children: React.ReactNode;
  /** Custom className */
  className?: string;
}

export function TabContent({
  activeTab,
  tabId,
  children,
  className = "",
}: TabContentProps) {
  if (activeTab !== tabId) return null;

  return <div className={className}>{children}</div>;
}
