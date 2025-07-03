// Reusable Skeleton Loading Components

interface SkeletonProps {
  /** Custom className for styling */
  className?: string;
  /** Whether to animate the skeleton */
  animate?: boolean;
}

export function Skeleton({ className = "", animate = true }: SkeletonProps) {
  return (
    <div
      className={`bg-gray-200 rounded ${
        animate ? "animate-pulse" : ""
      } ${className}`}
    />
  );
}

// Text skeleton with different sizes
interface TextSkeletonProps extends SkeletonProps {
  /** Size of the text skeleton */
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
  /** Width of the skeleton */
  width?: "full" | "3/4" | "2/3" | "1/2" | "1/3" | "1/4";
}

export function TextSkeleton({
  size = "md",
  width = "full",
  className = "",
  animate = true,
}: TextSkeletonProps) {
  const sizeClasses = {
    xs: "h-3",
    sm: "h-4",
    md: "h-5",
    lg: "h-6",
    xl: "h-7",
    "2xl": "h-8",
    "3xl": "h-10",
  };

  const widthClasses = {
    full: "w-full",
    "3/4": "w-3/4",
    "2/3": "w-2/3",
    "1/2": "w-1/2",
    "1/3": "w-1/3",
    "1/4": "w-1/4",
  };

  return (
    <Skeleton
      className={`${sizeClasses[size]} ${widthClasses[width]} ${className}`}
      animate={animate}
    />
  );
}

// Avatar skeleton
interface AvatarSkeletonProps extends SkeletonProps {
  /** Size of the avatar */
  size?: "sm" | "md" | "lg" | "xl";
}

export function AvatarSkeleton({
  size = "md",
  className = "",
  animate = true,
}: AvatarSkeletonProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-20 h-20",
  };

  return (
    <Skeleton
      className={`${sizeClasses[size]} rounded-full ${className}`}
      animate={animate}
    />
  );
}

// Card skeleton
interface CardSkeletonProps extends SkeletonProps {
  /** Whether to show avatar in the card */
  showAvatar?: boolean;
  /** Number of text lines to show */
  lines?: number;
  /** Padding inside the card */
  padding?: "sm" | "md" | "lg";
}

export function CardSkeleton({
  showAvatar = false,
  lines = 3,
  padding = "md",
  className = "",
  animate = true,
}: CardSkeletonProps) {
  const paddingClasses = {
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 ${paddingClasses[padding]} ${className}`}
    >
      <div className="space-y-4">
        {showAvatar && (
          <div className="flex items-center space-x-3">
            <AvatarSkeleton size="md" animate={animate} />
            <div className="flex-1 space-y-2">
              <TextSkeleton size="md" width="3/4" animate={animate} />
              <TextSkeleton size="sm" width="1/2" animate={animate} />
            </div>
          </div>
        )}

        <div className="space-y-3">
          {Array.from({ length: lines }).map((_, index) => (
            <TextSkeleton
              key={index}
              size="sm"
              width={index === lines - 1 ? "3/4" : "full"}
              animate={animate}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Button skeleton
interface ButtonSkeletonProps extends SkeletonProps {
  /** Size of the button */
  size?: "sm" | "md" | "lg";
  /** Width of the button */
  width?: "auto" | "full";
}

export function ButtonSkeleton({
  size = "md",
  width = "auto",
  className = "",
  animate = true,
}: ButtonSkeletonProps) {
  const sizeClasses = {
    sm: "h-8 px-3",
    md: "h-10 px-4",
    lg: "h-12 px-6",
  };

  const widthClasses = {
    auto: "w-24",
    full: "w-full",
  };

  return (
    <Skeleton
      className={`${sizeClasses[size]} ${widthClasses[width]} rounded-lg ${className}`}
      animate={animate}
    />
  );
}

// Table skeleton
interface TableSkeletonProps extends SkeletonProps {
  /** Number of rows to show */
  rows?: number;
  /** Number of columns to show */
  columns?: number;
  /** Whether to show table header */
  showHeader?: boolean;
}

export function TableSkeleton({
  rows = 5,
  columns = 4,
  showHeader = true,
  className = "",
  animate = true,
}: TableSkeletonProps) {
  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          {showHeader && (
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {Array.from({ length: columns }).map((_, index) => (
                  <th key={index} className="px-6 py-4">
                    <TextSkeleton size="sm" width="3/4" animate={animate} />
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody className="divide-y divide-gray-200">
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={rowIndex}>
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <td key={colIndex} className="px-6 py-4">
                    <TextSkeleton
                      size="sm"
                      width={colIndex === 0 ? "full" : "3/4"}
                      animate={animate}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Series table skeleton rows - specialized for series table structure
interface SeriesTableSkeletonProps extends SkeletonProps {
  /** Number of skeleton rows to show */
  rows?: number;
}

export function SeriesTableSkeleton({
  rows = 3,
  className = "",
  animate = true,
}: SeriesTableSkeletonProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, index) => (
        <tr key={index} className="border-b border-gray-200">
          {/* Series Name Column */}
          <td className="px-6 py-4">
            <div className="space-y-2">
              <TextSkeleton size="md" width="3/4" animate={animate} />
              <TextSkeleton size="sm" width="1/2" animate={animate} />
            </div>
          </td>

          {/* Chapters Column */}
          <td className="px-6 py-4">
            <TextSkeleton size="sm" width="1/4" animate={animate} />
          </td>

          {/* Actions Column */}
          <td className="px-6 py-4 text-right">
            <div className="flex justify-end space-x-2">
              <ButtonSkeleton size="sm" width="auto" animate={animate} />
              <ButtonSkeleton size="sm" width="auto" animate={animate} />
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}

export default Skeleton;
