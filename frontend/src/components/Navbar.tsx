import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Logo section */}
      <div className="h-24 p-4 border-b border-gray-200">
        <Link
          to="/"
          className="flex items-center gap-2 font-medium text-gray-800"
        >
          <span className="text-xl">📄</span>
          <span>ManhwaTrans</span>
        </Link>
      </div>

      {/* Navigation links */}
      <div className="flex-1 p-2">
        <nav className="space-y-1">
          <Link
            to="/dashboard"
            className="flex items-center gap-3 p-3 bg-blue-50 rounded-md text-blue-700"
          >
            <span className="text-lg">⊞</span>
            <span>Dashboard</span>
          </Link>
          <Link
            to="/series"
            className="flex items-center gap-3 p-3 rounded-md text-gray-500 hover:bg-gray-100"
          >
            <span className="text-lg">🗋</span>
            <span>Series</span>
          </Link>
          <Link
            to="/users"
            className="flex items-center gap-3 p-3 rounded-md text-gray-500 hover:bg-gray-100"
          >
            <span className="text-lg">👤</span>
            <span>Users</span>
          </Link>
        </nav>
      </div>

      {/* Collapse button at bottom */}
      <div className="p-4 border-t border-gray-200">
        <button className="flex items-center gap-3 w-full p-2 text-gray-600 hover:bg-gray-100 rounded-md">
          <span className="text-lg">📚</span>
          <span>Collapse</span>
        </button>
      </div>
    </div>
  );
}
