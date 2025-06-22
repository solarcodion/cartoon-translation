import { Link, useLocation } from "react-router-dom";
import {
  FiGrid,
  FiFileText,
  FiUsers,
  FiMenu,
  FiChevronRight,
} from "react-icons/fi";
import { useUserProfile } from "../../hooks/useUserProfile";

interface NavbarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export default function Navbar({ collapsed, setCollapsed }: NavbarProps) {
  const { user } = useUserProfile();
  const location = useLocation();

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  // Function to determine if a link is active
  const isActiveLink = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  // Function to get link classes based on active state
  const getLinkClasses = (path: string) => {
    const baseClasses = `flex items-center ${
      collapsed ? "justify-center" : "justify-start"
    } gap-3 p-3 rounded-md transition-colors`;

    if (isActiveLink(path)) {
      return `${baseClasses} bg-gray-100 text-gray-700`;
    }
    return `${baseClasses} text-gray-500 hover:bg-gray-100`;
  };

  return (
    <div
      className={`flex flex-col h-full bg-white border-r border-gray-200 overflow-hidden transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Logo section */}
      <div className="h-24 p-4 border-b border-gray-200 flex justify-start items-center">
        <Link
          to="/"
          className="flex items-center justify-start gap-3 w-full h-full font-medium text-gray-800"
        >
          <FiFileText className="text-2xl" />
          {!collapsed && <span className="text-lg">ManhwaTrans</span>}
        </Link>
      </div>

      {/* Navigation links */}
      <div className="flex-1 p-2">
        <nav className="space-y-1">
          <Link to="/" className={getLinkClasses("/")}>
            <FiGrid className="text-lg" />
            {!collapsed && <span>Dashboard</span>}
          </Link>
          <Link to="/series" className={getLinkClasses("/series")}>
            <FiFileText className="text-lg" />
            {!collapsed && <span>Series</span>}
          </Link>
          {/* Users tab - only visible for admin users */}
          {user?.role === "admin" && (
            <Link to="/users" className={getLinkClasses("/users")}>
              <FiUsers className="text-lg" />
              {!collapsed && <span>Users</span>}
            </Link>
          )}
        </nav>
      </div>

      {/* Collapse button at bottom */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={toggleCollapse}
          className={`flex items-center ${
            collapsed ? "justify-center" : "justify-between"
          } w-full p-2 text-gray-600 hover:bg-gray-100 rounded-md`}
        >
          <div className="flex items-center gap-3">
            <FiMenu className="text-lg" />
            {!collapsed && <span>Collapse</span>}
          </div>
          {!collapsed && (
            <FiChevronRight
              className={`transform transition-transform ${
                collapsed ? "rotate-180" : ""
              }`}
            />
          )}
        </button>
      </div>
    </div>
  );
}
