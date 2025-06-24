import { useState, useEffect } from "react";
import { FiX, FiUser, FiSave, FiImage, FiCheck } from "react-icons/fi";
import type { User } from "../../types/auth";

interface EditProfileModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (profileData: {
    name?: string;
    avatar_url?: string;
  }) => Promise<void>;
}

export default function EditProfileModal({
  user,
  isOpen,
  onClose,
  onSave,
}: EditProfileModalProps) {
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; avatar_url?: string }>(
    {}
  );

  // Update form fields when user changes
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setAvatarUrl(user.avatar_url || "");
      setErrors({});
      setIsSuccess(false);
    }
  }, [user]);

  const validateForm = () => {
    const newErrors: { name?: string; avatar_url?: string } = {};

    if (!name.trim()) {
      newErrors.name = "Name is required";
    } else if (name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    if (avatarUrl && !isValidUrl(avatarUrl)) {
      newErrors.avatar_url = "Please enter a valid URL";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch {
      return false;
    }
  };

  const handleSave = async () => {
    if (!user || !validateForm()) return;

    try {
      setIsLoading(true);
      setIsSuccess(false);

      const profileData: { name?: string; avatar_url?: string } = {};

      // Only include changed fields
      if (name.trim() !== user.name) {
        profileData.name = name.trim();
      }

      if (avatarUrl !== (user.avatar_url || "")) {
        profileData.avatar_url = avatarUrl || undefined;
      }

      // If no changes, just close the modal
      if (Object.keys(profileData).length === 0) {
        onClose();
        return;
      }

      await onSave(profileData);

      // Show success state briefly before closing
      setIsSuccess(true);
      setTimeout(() => {
        onClose();
      }, 800);
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading && !isSuccess) {
      onClose();
    }
  };

  const hasChanges = () => {
    if (!user) return false;
    return name.trim() !== user.name || avatarUrl !== (user.avatar_url || "");
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Edit Profile</h2>
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
          {/* Current Avatar Preview */}
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center justify-center w-20 h-20 bg-gray-200 rounded-full">
              {avatarUrl || user.avatar_url ? (
                <img
                  src={avatarUrl || user.avatar_url}
                  alt={user.name}
                  className="w-20 h-20 rounded-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <FiUser className="text-gray-500 text-2xl" />
              )}
            </div>
          </div>

          {/* Name Field */}
          <div className="mb-4">
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Display Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:bg-gray-50 ${
                errors.name ? "border-red-300" : "border-gray-300"
              }`}
              placeholder="Enter your display name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Avatar URL Field */}
          <div className="mb-6">
            <label
              htmlFor="avatar_url"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              <FiImage className="inline mr-1" />
              Avatar URL (optional)
            </label>
            <input
              type="url"
              id="avatar_url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              disabled={isLoading}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:bg-gray-50 ${
                errors.avatar_url ? "border-red-300" : "border-gray-300"
              }`}
              placeholder="https://example.com/avatar.jpg"
            />
            {errors.avatar_url && (
              <p className="mt-1 text-sm text-red-600">{errors.avatar_url}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Enter a URL to an image for your profile picture
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
            disabled={isLoading || isSuccess || !hasChanges()}
            className={`
              relative flex items-center justify-center gap-2 px-6 py-2.5 min-w-[140px]
              text-white font-medium rounded-lg transition-all duration-200
              ${
                isSuccess
                  ? "bg-green-500 cursor-default"
                  : isLoading
                  ? "bg-blue-500 cursor-not-allowed"
                  : hasChanges()
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
