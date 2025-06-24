import { Link, useLocation } from "react-router-dom";
import {
  FiGrid,
  FiFileText,
  FiUsers,
  FiMenu,
  FiChevronRight,
  FiX,
} from "react-icons/fi";
import { useAuth } from "../../hooks/useAuth";
import type { User } from "../../types/auth";

interface NavbarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export default function Navbar({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
}: NavbarProps) {
  const { user } = useAuth();
  const location = useLocation();

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  const closeMobile = () => {
    setMobileOpen(false);
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
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={closeMobile}
        />
      )}

      {/* Desktop Sidebar */}
      <div
        className={`hidden lg:flex flex-col h-full bg-white border-r border-gray-200 overflow-hidden transition-all duration-300 ${
          collapsed ? "w-16" : "w-64"
        }`}
      >
        {/* Desktop Content */}
        <NavbarContent
          collapsed={collapsed}
          user={user}
          getLinkClasses={getLinkClasses}
          toggleCollapse={toggleCollapse}
          onLinkClick={() => {}} // No action needed for desktop
        />
      </div>

      {/* Mobile Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Mobile Header with Close Button */}
        <div className="h-16 p-4 border-b border-gray-200 flex justify-between items-center">
          <Link
            to="/"
            className="flex items-center gap-3 font-medium text-gray-800"
            onClick={closeMobile}
          >
            <FiFileText className="text-2xl" />
            <span className="text-lg">ManhwaTrans</span>
          </Link>
          <button
            onClick={closeMobile}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
          >
            <FiX className="text-lg" />
          </button>
        </div>

        {/* Mobile Content */}
        <NavbarContent
          collapsed={false}
          user={user}
          getLinkClasses={getLinkClasses}
          toggleCollapse={toggleCollapse}
          onLinkClick={closeMobile} // Close mobile menu when link is clicked
        />
      </div>
    </>
  );
}

// Shared navbar content component
function NavbarContent({
  collapsed,
  user,
  getLinkClasses,
  toggleCollapse,
  onLinkClick,
}: {
  collapsed: boolean;
  user: User | null;
  getLinkClasses: (path: string) => string;
  toggleCollapse: () => void;
  onLinkClick: () => void;
}) {
  return (
    <>
      {/* Logo section - Desktop only */}
      {!collapsed && (
        <div className="hidden lg:block h-24 p-4 border-b border-gray-200">
          <Link
            to="/"
            className="flex items-center justify-start gap-3 w-full h-full font-medium text-gray-800"
          >
            <FiFileText className="text-2xl" />
            <span className="text-lg">ManhwaTrans</span>
          </Link>
        </div>
      )}

      {/* Collapsed logo - Desktop only */}
      {collapsed && (
        <div className="hidden lg:flex h-24 p-4 border-b border-gray-200 justify-center items-center">
          <Link
            to="/"
            className="flex items-center justify-center font-medium text-gray-800"
          >
            <FiFileText className="text-2xl" />
          </Link>
        </div>
      )}

      {/* Navigation links */}
      <div className="flex-1 p-2">
        <nav className="space-y-1">
          <Link to="/" className={getLinkClasses("/")} onClick={onLinkClick}>
            <FiGrid className="text-lg" />
            {!collapsed && <span>Dashboard</span>}
          </Link>
          <Link
            to="/series"
            className={getLinkClasses("/series")}
            onClick={onLinkClick}
          >
            <FiFileText className="text-lg" />
            {!collapsed && <span>Series</span>}
          </Link>
          {/* Users tab - only visible for admin users */}
          {user?.role === "admin" && (
            <Link
              to="/users"
              className={getLinkClasses("/users")}
              onClick={onLinkClick}
            >
              <FiUsers className="text-lg" />
              {!collapsed && <span>Users</span>}
            </Link>
          )}
        </nav>
      </div>

      {/* Collapse button at bottom - Desktop only */}
      <div className="hidden lg:block p-4 border-t border-gray-200">
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
    </>
  );
}
