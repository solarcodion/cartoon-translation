// AI Insight Panel Component

import { FiAlertTriangle } from "react-icons/fi";
import { LuBrain } from "react-icons/lu";
import { useState, useEffect } from "react";
import type { AIInsights } from "../../types";

interface AIInsightPanelProps {
  /** AI insights data */
  aiInsights: AIInsights | null;
  /** Whether the AI insights are currently loading */
  isLoading?: boolean;
  /** Custom className for styling */
  className?: string;
  /** Whether to show the panel in compact mode */
  compact?: boolean;
  /** Custom title for the panel */
  title?: string;
  /** Custom subtitle for the panel */
  subtitle?: string;
}

export default function AIInsightPanel({
  aiInsights,
  isLoading = false,
  className = "",
  compact = false,
  title = "AI Insights",
  subtitle = "Automated quality checks & suggestions.",
}: AIInsightPanelProps) {
  // State for animated progress
  const [animatedProgress, setAnimatedProgress] = useState(0);

  // Animate progress when aiInsights changes
  useEffect(() => {
    if (aiInsights && !isLoading) {
      // Reset to 0 first
      setAnimatedProgress(0);

      // Start animation after a small delay
      const timer = setTimeout(() => {
        setAnimatedProgress(aiInsights.overall_quality_score);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [aiInsights, isLoading]);
  // Get progress bar color based on score
  const getProgressColor = (score: number) => {
    if (score >= 90) return "bg-green-500";
    if (score >= 70) return "bg-yellow-500";
    return "bg-red-500";
  };

  // Get score text color based on score
  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  // Get insight alert color based on score
  const getInsightColor = (score: number) => {
    if (score >= 90) return "bg-green-50 border-green-200";
    if (score >= 70) return "bg-yellow-50 border-yellow-200";
    return "bg-red-50 border-red-200";
  };

  // Get insight icon color based on score
  const getInsightIconColor = (score: number) => {
    if (score >= 90) return "text-green-500";
    if (score >= 70) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 ${
        compact ? "p-4" : "p-6"
      } h-full ${className}`}
    >
      {/* Header */}
      <div className={`flex items-center gap-2 ${compact ? "mb-3" : "mb-4"}`}>
        <LuBrain
          className={`${compact ? "text-base" : "text-lg"} text-orange-500`}
        />
        <h3
          className={`${
            compact ? "text-base" : "text-lg"
          } font-semibold text-gray-900`}
        >
          {title}
        </h3>
      </div>

      {/* Subtitle */}
      <p className={`text-sm text-gray-600 ${compact ? "mb-4" : "mb-6"}`}>
        {subtitle}
      </p>

      {/* Content */}
      {isLoading ? (
        /* Loading State - Show skeleton */
        <>
          {/* Loading Quality Score */}
          <div className={compact ? "mb-4" : "mb-6"}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">
                Overall Quality Score:
              </span>
              <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
            </div>

            {/* Progress Bar Skeleton */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="h-2 bg-gray-300 rounded-full w-3/4 animate-pulse"></div>
            </div>
          </div>

          {/* Loading Insights */}
          <div className="space-y-3">
            <div className="flex items-start gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="w-4 h-4 bg-gray-200 rounded mt-0.5 flex-shrink-0"></div>
              <div className="flex-1 space-y-1">
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          </div>
        </>
      ) : aiInsights ? (
        /* Data Available State */
        <>
          {/* Quality Score */}
          <div className={compact ? "mb-4" : "mb-6"}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">
                Overall Quality Score:
              </span>
              <span
                className={`${
                  compact ? "text-xl" : "text-2xl"
                } font-bold ${getScoreColor(aiInsights.overall_quality_score)}`}
              >
                {aiInsights.overall_quality_score}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`${getProgressColor(
                  aiInsights.overall_quality_score
                )} h-2 rounded-full transition-all duration-1000 ease-out`}
                style={{ width: `${animatedProgress}%` }}
              ></div>
            </div>
          </div>

          {/* Insights */}
          <div className="space-y-3">
            {aiInsights.insights.map((insight, index) => (
              <div
                key={index}
                className={`flex items-start gap-2 p-3 ${getInsightColor(
                  aiInsights.overall_quality_score
                )} border rounded-lg`}
              >
                <FiAlertTriangle
                  className={`w-4 h-4 ${getInsightIconColor(
                    aiInsights.overall_quality_score
                  )} mt-0.5 flex-shrink-0`}
                />
                <span className="text-sm text-gray-700">{insight}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <LuBrain className="text-4xl text-gray-300 mb-3" />
          <p className="text-sm text-gray-500 mb-2">No AI insights available</p>
          <p className="text-xs text-gray-400">
            Insights will appear after content analysis
          </p>
        </div>
      )}
    </div>
  );
}
