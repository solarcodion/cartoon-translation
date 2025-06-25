import { useState } from "react";
import {
  FiUser,
  FiMail,
  FiShield,
  FiCalendar,
  FiClock,
  FiEdit2,
} from "react-icons/fi";
import { useAuth } from "../hooks/useAuth";
import { LoadingSpinner } from "../components/common";
import EditProfileModal from "../components/Modals/EditProfileModal";
import {
  userService,
  type UpdateProfileRequest,
} from "../services/userService";
import { supabase } from "../lib/supabase";

export default function Profile() {
  const { user, isLoading, refreshUser } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const handleUpdateProfile = async (profileData: UpdateProfileRequest) => {
    try {
      setIsUpdating(true);
      setUpdateError(null);

      if (!user) {
        setUpdateError(
          "User not found. Please refresh the page and try again."
        );
        return;
      }

      // Get access token from Supabase
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("Session error:", sessionError);
        setUpdateError(`Session error: ${sessionError.message}`);
        return;
      }

      if (!session?.access_token) {
        setUpdateError("No valid session found. Please log in again.");
        return;
      }

      await userService.updateMyProfile(profileData, session.access_token);

      await refreshUser();
    } catch (error) {
      console.error("❌ Error updating profile:", error);

      // Enhanced error handling
      if (error instanceof Error) {
        if (error.message.includes("Not authenticated")) {
          setUpdateError(
            "Authentication failed. Please log out and log in again."
          );
        } else if (error.message.includes("CORS")) {
          setUpdateError(
            "Connection error. Please check if the backend is running."
          );
        } else {
          setUpdateError(`Update failed: ${error.message}`);
        }
      } else {
        setUpdateError("Failed to update profile. Please try again.");
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not available";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "Invalid date:" + error;
    }
  };

  if (isLoading) {
    return (
      <LoadingSpinner
        text="Loading profile..."
        className="min-h-[400px]"
        centered
      />
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-gray-400 text-xl mb-2">👤</div>
          <p className="text-gray-600">No user data available</p>
        </div>
      </div>
    );
  }

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "editor":
        return "bg-blue-100 text-blue-800";
      case "translator":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile</h1>
          <p className="text-gray-600">
            View and edit your account information.
          </p>
        </div>
        <button
          onClick={() => setIsEditModalOpen(true)}
          disabled={isUpdating}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FiEdit2 className="text-sm" />
          Edit Profile
        </button>
      </div>

      {/* Error Message */}
      {updateError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{updateError}</p>
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-8">
          <div className="flex items-center gap-6">
            {/* Avatar */}
            <div className="flex items-center justify-center w-24 h-24 bg-white rounded-full shadow-lg">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.name}
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <FiUser className="text-blue-600 text-3xl" />
              )}
            </div>

            {/* User Info */}
            <div className="text-white">
              <h2 className="text-2xl font-bold mb-1">{user.name}</h2>
              <p className="text-blue-100 mb-3">{user.email}</p>
              {user.role && (
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor(
                    user.role
                  )}`}
                >
                  <FiShield className="mr-1.5 text-xs" />
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Account Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Email */}
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg">
                <FiMail className="text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Email Address
                </p>
                <p className="text-sm text-gray-600">{user.email}</p>
              </div>
            </div>

            {/* Role */}
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg">
                <FiShield className="text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Role</p>
                <p className="text-sm text-gray-600">
                  {user.role
                    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
                    : "Not specified"}
                </p>
              </div>
            </div>

            {/* Account Created */}
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg">
                <FiCalendar className="text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Account Created
                </p>
                <p className="text-sm text-gray-600">
                  {formatDate(user.created_at)}
                </p>
              </div>
            </div>

            {/* Last Updated */}
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg">
                <FiClock className="text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Last Updated
                </p>
                <p className="text-sm text-gray-600">
                  {formatDate(user.updated_at)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        user={user}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleUpdateProfile}
      />
    </div>
  );
}
