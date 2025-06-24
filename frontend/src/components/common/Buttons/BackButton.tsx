// Global Back Button Component

import React from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";

interface BackButtonProps {
  /** Custom text to display (default: "Back") */
  text?: string;
  /** Custom onClick handler (overrides default navigation) */
  onClick?: () => void;
  /** Custom path to navigate to (overrides default back navigation) */
  to?: string;
  /** Custom className for styling */
  className?: string;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Style variant */
  variant?: "default" | "ghost" | "outline";
  /** Whether to show the arrow icon */
  showIcon?: boolean;
  /** Custom icon component */
  icon?: React.ReactNode;
}

export default function BackButton({
  text = "Back",
  onClick,
  to,
  className = "",
  size = "md",
  variant = "default",
  showIcon = true,
  icon,
}: BackButtonProps) {
  const navigate = useNavigate();

  // Size configurations
  const sizeConfig = {
    sm: "px-3 py-1.5 text-sm gap-1",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-6 py-3 text-base gap-3",
  };

  // Variant configurations
  const variantConfig = {
    default: "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200",
    ghost: "bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-800",
    outline: "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300",
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (to) {
      navigate(to);
    } else {
      navigate(-1); // Default back navigation
    }
  };

  const iconElement = icon || (showIcon && <FiArrowLeft className="text-current" />);

  return (
    <button
      onClick={handleClick}
      className={`
        inline-flex items-center justify-center
        ${sizeConfig[size]}
        ${variantConfig[variant]}
        rounded-lg transition-colors cursor-pointer
        font-medium
        ${className}
      `.trim()}
    >
      {iconElement}
      <span>{text}</span>
    </button>
  );
}

// Convenience components for common use cases
export function BackToSeries({ 
  seriesId, 
  className 
}: { 
  seriesId?: string; 
  className?: string; 
}) {
  return (
    <BackButton
      text="Back to Series"
      to={seriesId ? `/series/${seriesId}` : "/series"}
      className={className}
    />
  );
}

export function BackToChapters({ 
  seriesId, 
  className 
}: { 
  seriesId: string; 
  className?: string; 
}) {
  return (
    <BackButton
      text="Back to Chapters"
      to={`/series/${seriesId}/chapters`}
      className={className}
    />
  );
}

export function BackToPages({ 
  seriesId, 
  chapterId, 
  className 
}: { 
  seriesId: string; 
  chapterId: string; 
  className?: string; 
}) {
  return (
    <BackButton
      text="Back to Pages"
      to={`/series/${seriesId}/chapters/${chapterId}/pages`}
      className={className}
    />
  );
}

export function BackToUsers({ className }: { className?: string }) {
  return (
    <BackButton
      text="Back to Users"
      to="/users"
      className={className}
    />
  );
}

// Simple back button without text (icon only)
export function BackIconButton({ 
  onClick, 
  className,
  size = "md" 
}: { 
  onClick?: () => void; 
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizeConfig = {
    sm: "p-1.5",
    md: "p-2",
    lg: "p-3",
  };

  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(-1);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`
        inline-flex items-center justify-center
        ${sizeConfig[size]}
        bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200
        rounded-lg transition-colors cursor-pointer
        ${className}
      `.trim()}
      title="Go back"
    >
      <FiArrowLeft className="text-current" />
    </button>
  );
}
