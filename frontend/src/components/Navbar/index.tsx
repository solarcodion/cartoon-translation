import { Link } from "react-router-dom";
import {
  FiGrid,
  FiFileText,
  FiUsers,
  FiMenu,
  FiChevronRight,
} from "react-icons/fi";

interface NavbarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export default function Navbar({ collapsed, setCollapsed }: NavbarProps) {
  const toggleCollapse = () => {
    setCollapsed(!collapsed);
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
          <Link
            to="/"
            className={`flex items-center ${
              collapsed ? "justify-center" : "justify-start"
            } gap-3 p-3 bg-gray-100 rounded-md text-gray-700`}
          >
            <FiGrid className="text-lg" />
            {!collapsed && <span>Dashboard</span>}
          </Link>
          <Link
            to="/series"
            className={`flex items-center ${
              collapsed ? "justify-center" : "justify-start"
            } gap-3 p-3 rounded-md text-gray-500 hover:bg-gray-100`}
          >
            <FiFileText className="text-lg" />
            {!collapsed && <span>Series</span>}
          </Link>
          <Link
            to="/users"
            className={`flex items-center ${
              collapsed ? "justify-center" : "justify-start"
            } gap-3 p-3 rounded-md text-gray-500 hover:bg-gray-100`}
          >
            <FiUsers className="text-lg" />
            {!collapsed && <span>Users</span>}
          </Link>
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
