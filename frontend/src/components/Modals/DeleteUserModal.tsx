import { useState } from "react";
import { FiX, FiTrash2, FiAlertTriangle, FiUser } from "react-icons/fi";

// MockUser type definition moved inline since mockData was removed
interface MockUser {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: "admin" | "editor" | "translator";
  created_at: string;
  updated_at: string;
}

interface DeleteUserModalProps {
  user: MockUser | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (userId: string) => Promise<void>;
}

export default function DeleteUserModal({
  user,
  isOpen,
  onClose,
  onDelete,
}: DeleteUserModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      await onDelete(user.id);
      onClose();
    } catch (error) {
      console.error("Error deleting user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLoading) {
      handleDelete();
    }
    if (e.key === "Escape") {
      handleClose();
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800 border-red-200";
      case "editor":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "translator":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-full">
              <FiAlertTriangle className="text-red-600 text-lg" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Delete User
            </h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <FiX className="text-lg" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6" onKeyDown={handleKeyPress} tabIndex={-1}>
          {/* Warning Message */}
          <div className="mb-6">
            <p className="text-gray-900 mb-2">
              Are you sure you want to delete this user?
            </p>
            <p className="text-sm text-gray-600">
              This action cannot be undone. The user will be permanently removed from the system.
            </p>
          </div>

          {/* User Info */}
          <div className="flex items-center gap-3 mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <FiUser className="text-red-600 text-xl" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">{user.name}</h3>
              <p className="text-sm text-gray-600">{user.email}</p>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border mt-1 ${getRoleBadgeColor(
                  user.role
                )}`}
              >
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </span>
            </div>
          </div>

          {/* Warning Box */}
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <FiAlertTriangle className="text-yellow-600 text-lg mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-yellow-800 mb-1">
                  Warning: This action is irreversible
                </h4>
                <p className="text-xs text-yellow-700">
                  Deleting this user will permanently remove:
                </p>
                <ul className="text-xs text-yellow-700 mt-1 ml-4 list-disc">
                  <li>User account and profile information</li>
                  <li>Access to the system and all permissions</li>
                  <li>Associated work history and contributions</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Help Text */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600">
              <strong>Tip:</strong> Press Enter to confirm deletion or Escape to
              cancel
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="px-4 py-2 min-w-[120px] text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-4 py-2 min-w-[140px] bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <FiTrash2 className="text-sm" />
                <span>Delete User</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
