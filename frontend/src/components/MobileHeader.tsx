import { FiMenu } from "react-icons/fi";
import ProfileDropdown from "./Header/ProfileDropdown";

interface MobileHeaderProps {
  onMenuClick: () => void;
}

export default function MobileHeader({ onMenuClick }: MobileHeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Left side - Menu button only */}
        <div className="flex items-center">
          <button
            onClick={onMenuClick}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
          >
            <FiMenu className="text-lg" />
          </button>
        </div>

        {/* Right side - Profile */}
        <div className="flex items-center">
          <ProfileDropdown />
        </div>
      </div>
    </header>
  );
}
