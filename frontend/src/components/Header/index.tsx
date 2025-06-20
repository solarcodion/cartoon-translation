import { useState, useRef, useEffect } from "react";
import { FiLogOut, FiUser, FiChevronDown } from "react-icons/fi";
import { useAuth } from "../../hooks/useAuth";

export default function Header() {
  const { logout, user } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await logout();
    setIsDropdownOpen(false);
  };

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-6">
      {/* Left side - could be used for breadcrumbs or page title in the future */}
      <div className="flex items-center">
        <h1 className="text-lg font-semibold text-gray-800">Dashboard</h1>
      </div>

      {/* Right side - User profile dropdown */}
      <div className="flex items-center">
        {user && (
          <div className="relative" ref={dropdownRef}>
            {/* Profile trigger button */}
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.display_name || user.email}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <FiUser className="text-blue-600 text-sm" />
                )}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-sm font-medium text-gray-900">
                  {user.display_name || user.email.split("@")[0]}
                </span>
              </div>
              <FiChevronDown
                className={`text-gray-400 transition-transform ${
                  isDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Dropdown menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                {/* User info in dropdown */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.display_name || user.email}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <FiUser className="text-blue-600" />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900">
                        {user.display_name || user.email.split("@")[0]}
                      </span>
                      <span className="text-xs text-gray-500">
                        {user.email}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Dropdown actions */}
                <div className="py-2">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <FiLogOut className="text-lg" />
                    <span className="text-sm font-medium">Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
