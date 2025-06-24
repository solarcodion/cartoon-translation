import { FiMenu } from "react-icons/fi";
import ProfileDropdown from "../Dropdown/ProfileDropdown";

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function LayoutHeader({ onMenuClick }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200">
      {/* Desktop Header */}
      <div className="hidden lg:flex h-24 items-center justify-between px-6">
        {/* Left side - could be used for breadcrumbs or page title in the future */}
        <div className="flex items-center">
          {/* Empty space for future breadcrumbs or page title */}
        </div>

        {/* Right side - User profile dropdown */}
        <div className="flex items-center">
          <ProfileDropdown />
        </div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left side - Menu button only */}
          <div className="flex items-center">
            {onMenuClick && (
              <button
                onClick={onMenuClick}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
              >
                <FiMenu className="text-lg" />
              </button>
            )}
          </div>

          {/* Right side - Profile */}
          <div className="flex items-center">
            <ProfileDropdown />
          </div>
        </div>
      </div>
    </header>
  );
}
