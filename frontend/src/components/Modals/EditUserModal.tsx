import { useState, useEffect } from "react";
import { FiX, FiUser, FiSave, FiCheck } from "react-icons/fi";

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

interface EditUserModalProps {
  user: MockUser | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    userId: string,
    newRole: "admin" | "editor" | "translator"
  ) => Promise<void>;
}

export default function EditUserModal({
  user,
  isOpen,
  onClose,
  onSave,
}: EditUserModalProps) {
  const [selectedRole, setSelectedRole] = useState<
    "admin" | "editor" | "translator"
  >(user?.role || "translator");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Update selected role when user changes
  useEffect(() => {
    if (user) {
      setSelectedRole(user.role);
      setIsSuccess(false);
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setIsSuccess(false);
      await onSave(user.id, selectedRole);

      // Show success state briefly before closing
      setIsSuccess(true);
      setTimeout(() => {
        onClose();
      }, 800);
    } catch (error) {
      console.error("Error saving user role:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading && !isSuccess) {
      onClose();
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
          <h2 className="text-xl font-semibold text-gray-900">
            Edit User Role
          </h2>
          <button
            onClick={handleClose}
            disabled={isLoading || isSuccess}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
          >
            <FiX className="text-lg" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {/* User Info */}
          <div className="flex items-center gap-3 mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center w-12 h-12 bg-gray-200 rounded-full">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <FiUser className="text-gray-500 text-xl" />
              )}
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{user.name}</h3>
              <p className="text-sm text-gray-600">{user.email}</p>
            </div>
          </div>

          {/* Role Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Select Role
            </label>
            <div className="space-y-2">
              {(["admin", "editor", "translator"] as const).map((role) => (
                <label
                  key={role}
                  className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <input
                    type="radio"
                    name="role"
                    value={role}
                    checked={selectedRole === role}
                    onChange={(e) =>
                      setSelectedRole(e.target.value as typeof role)
                    }
                    className="text-blue-600 focus:ring-blue-500"
                    disabled={isLoading}
                  />
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium text-gray-900 capitalize">
                      {role}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeColor(
                        role
                      )}`}
                    >
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Role Descriptions */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>Admin:</strong> Full access to all features including user
              management
              <br />
              <strong>Editor:</strong> Can manage content and translations
              <br />
              <strong>Translator:</strong> Can work on translations only
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={handleClose}
            disabled={isLoading || isSuccess}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading || isSuccess || selectedRole === user.role}
            className={`
              relative flex items-center justify-center gap-2 px-6 py-2.5 min-w-[140px]
              text-white font-medium rounded-lg transition-all duration-200
              ${
                isSuccess
                  ? "bg-green-500 cursor-default"
                  : isLoading
                  ? "bg-blue-500 cursor-not-allowed"
                  : selectedRole !== user.role
                  ? "bg-blue-600 hover:bg-blue-700 hover:shadow-md cursor-pointer"
                  : "bg-gray-400 cursor-not-allowed"
              }
              disabled:opacity-75
            `}
          >
            {isSuccess ? (
              <>
                <FiCheck className="text-sm" />
                <span>Saved!</span>
              </>
            ) : isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <FiSave className="text-sm" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
