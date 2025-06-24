// Reusable Loading Spinner Component

interface LoadingSpinnerProps {
  /** Loading text to display below the spinner */
  text?: string;
  /** Size of the spinner - affects both spinner and text */
  size?: "sm" | "md" | "lg";
  /** Whether to show as a full page loader with min-height */
  fullPage?: boolean;
  /** Whether to center the spinner in its container */
  centered?: boolean;
  /** Custom className for the container */
  className?: string;
  /** Color theme for the spinner */
  color?: "blue" | "white" | "gray";
}

export default function LoadingSpinner({
  text = "Loading...",
  size = "md",
  fullPage = false,
  centered = true,
  className = "",
  color = "blue",
}: LoadingSpinnerProps) {
  // Size configurations
  const sizeConfig = {
    sm: {
      spinner: "h-4 w-4",
      text: "text-xs",
      gap: "mb-2",
    },
    md: {
      spinner: "h-12 w-12",
      text: "text-sm",
      gap: "mb-4",
    },
    lg: {
      spinner: "h-16 w-16",
      text: "text-base",
      gap: "mb-6",
    },
  };

  // Color configurations
  const colorConfig = {
    blue: "border-blue-600",
    white: "border-white",
    gray: "border-gray-600",
  };

  const config = sizeConfig[size];
  const spinnerColor = colorConfig[color];

  // Container classes
  const containerClasses = [
    centered ? "flex items-center justify-center" : "",
    fullPage ? "min-h-screen" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={containerClasses}>
      <div className="text-center">
        <div
          className={`animate-spin rounded-full ${config.spinner} border-b-2 ${spinnerColor} mx-auto ${config.gap}`}
        ></div>
        {text && (
          <p className={`text-gray-600 ${config.text}`}>{text}</p>
        )}
      </div>
    </div>
  );
}

// Convenience components for common use cases
export function PageLoadingSpinner({ text }: { text?: string }) {
  return <LoadingSpinner text={text} fullPage centered />;
}

export function SectionLoadingSpinner({ text }: { text?: string }) {
  return <LoadingSpinner text={text} centered className="py-20" />;
}

export function InlineLoadingSpinner({ 
  text, 
  color = "white" 
}: { 
  text?: string; 
  color?: "blue" | "white" | "gray";
}) {
  return <LoadingSpinner text={text} size="sm" color={color} centered={false} />;
}
