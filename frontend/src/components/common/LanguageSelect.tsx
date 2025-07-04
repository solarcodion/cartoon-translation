import { useState, useRef, useEffect } from "react";
import { FiChevronDown, FiCheck } from "react-icons/fi";
import { SERIES_LANGUAGES, type LanguageOption, getLanguageOption } from "../../constants/languages";

interface LanguageSelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
  className?: string;
  placeholder?: string;
}

export default function LanguageSelect({
  value,
  onChange,
  disabled = false,
  error = false,
  className = "",
  placeholder = "Select language",
}: LanguageSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedLanguage = getLanguageOption(value);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen]);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleSelect = (language: LanguageOption) => {
    onChange(language.value);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`w-full px-3 py-2 text-left border rounded-lg focus:ring-2 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors ${
          error
            ? "border-red-300 focus:ring-red-500"
            : "border-gray-300 focus:ring-blue-500 hover:border-gray-400"
        } ${isOpen ? "ring-2 ring-blue-500 border-transparent" : ""}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {selectedLanguage ? (
              <>
                <span className="text-lg">{selectedLanguage.flag}</span>
                <span className="text-gray-900">{selectedLanguage.label}</span>
              </>
            ) : (
              <span className="text-gray-500">{placeholder}</span>
            )}
          </div>
          <FiChevronDown
            className={`text-gray-400 transition-transform duration-200 ${
              isOpen ? "transform rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
          {SERIES_LANGUAGES.map((language: LanguageOption) => (
            <button
              key={language.value}
              type="button"
              onClick={() => handleSelect(language)}
              className={`w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors ${
                value === language.value ? "bg-blue-50 text-blue-700" : "text-gray-900"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{language.flag}</span>
                  <span>{language.label}</span>
                </div>
                {value === language.value && (
                  <FiCheck className="text-blue-600" />
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
