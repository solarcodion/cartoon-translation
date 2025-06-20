import { Link } from "react-router-dom";
import { FiGrid, FiFileText, FiUsers, FiMenu } from "react-icons/fi";

export default function Navbar() {
  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Logo section */}
      <div className="h-24 p-4 border-b border-gray-200">
        <Link
          to="/"
          className="flex items-center gap-3 w-full h-full font-medium text-gray-800"
        >
          <FiFileText className="text-2xl" />
          <span className="text-lg">ManhwaTrans</span>
        </Link>
      </div>

      {/* Navigation links */}
      <div className="flex-1 p-2">
        <nav className="space-y-1">
          <Link
            to="/"
            className="flex items-center gap-3 p-3 bg-gray-100 rounded-md text-gray-700"
          >
            <FiGrid className="text-lg" />
            <span>Dashboard</span>
          </Link>
          <Link
            to="/series"
            className="flex items-center gap-3 p-3 rounded-md text-gray-500 hover:bg-gray-100"
          >
            <FiFileText className="text-lg" />
            <span>Series</span>
          </Link>
          <Link
            to="/users"
            className="flex items-center gap-3 p-3 rounded-md text-gray-500 hover:bg-gray-100"
          >
            <FiUsers className="text-lg" />
            <span>Users</span>
          </Link>
        </nav>
      </div>

      {/* Collapse button at bottom */}
      <div className="p-4 border-t border-gray-200">
        <button className="flex items-center gap-3 w-full p-2 text-gray-600 hover:bg-gray-100 rounded-md">
          <FiMenu className="text-lg" />
          <span>Collapse</span>
        </button>
      </div>
    </div>
  );
}
