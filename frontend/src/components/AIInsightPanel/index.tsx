// AI Insight Panel Component

import { FiAlertTriangle } from "react-icons/fi";
import { LuBrain } from "react-icons/lu";
import type { AIInsights } from "../../types";

interface AIInsightPanelProps {
  /** AI insights data */
  aiInsights: AIInsights | null;
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
  className = "",
  compact = false,
  title = "AI Insights",
  subtitle = "Automated quality checks & suggestions.",
}: AIInsightPanelProps) {
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
      {aiInsights ? (
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
                )} h-2 rounded-full transition-all duration-300`}
                style={{ width: `${aiInsights.overall_quality_score}%` }}
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
        /* Loading/Empty State */
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
