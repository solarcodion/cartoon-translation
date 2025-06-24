// Individual User Item Components for Desktop and Mobile

import { FiUser, FiTrash2 } from "react-icons/fi";
import { BiSolidEdit } from "react-icons/bi";
import type { DatabaseUser } from "../../../types/database";

interface UserItemProps {
  /** User data to display */
  user: DatabaseUser;
  /** Callback when edit button is clicked */
  onEdit: () => void;
  /** Callback when delete button is clicked */
  onDelete: () => void;
  /** Function to get role badge color classes */
  getRoleBadgeColor: (role: string) => string;
}

// Desktop Table Row Component
export function UserTableRow({
  user,
  onEdit,
  onDelete,
  getRoleBadgeColor,
}: UserItemProps) {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <FiUser className="text-gray-400" />
            )}
          </div>
          <div className="text-sm font-medium text-gray-900">
            {user.name}
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-600">{user.email}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(
            user.role
          )}`}
        >
          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right">
        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={onEdit}
            className="p-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
            title="Edit user"
          >
            <BiSolidEdit className="text-lg" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 bg-red-500 text-white hover:bg-red-600 rounded-lg transition-colors cursor-pointer"
            title="Delete user"
          >
            <FiTrash2 className="text-lg" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// Mobile List Item Component
export function UserListItem({
  user,
  onEdit,
  onDelete,
  getRoleBadgeColor,
}: UserItemProps) {
  return (
    <div className="p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between">
        {/* Left side - User info */}
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <FiUser className="text-gray-400 text-lg" />
              )}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.name}
              </p>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(
                  user.role
                )}`}
              >
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </span>
            </div>
            <p className="text-sm text-gray-500 truncate">
              {user.email}
            </p>
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center space-x-1 ml-3">
          <button
            onClick={onEdit}
            className="p-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
            title="Edit user"
          >
            <BiSolidEdit className="w-6 h-6" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 bg-red-500 text-white hover:bg-red-600 rounded-lg transition-colors cursor-pointer"
            title="Delete user"
          >
            <FiTrash2 className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
