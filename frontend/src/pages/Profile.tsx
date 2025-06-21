import { FiUser, FiMail, FiShield, FiCalendar, FiClock } from "react-icons/fi";
import { useUserProfile } from "../hooks/useUserProfile";

export default function Profile() {
  const { user, isLoading, error } = useUserProfile();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-2">⚠️</div>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not available";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Invalid date";
    }
  };

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
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile</h1>
        <p className="text-gray-600">View your account information and details.</p>
      </div>

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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Email */}
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg">
                <FiMail className="text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Email Address</p>
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
                  {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "Not specified"}
                </p>
              </div>
            </div>

            {/* Account Created */}
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg">
                <FiCalendar className="text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Account Created</p>
                <p className="text-sm text-gray-600">{formatDate(user.created_at)}</p>
              </div>
            </div>

            {/* Last Updated */}
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg">
                <FiClock className="text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Last Updated</p>
                <p className="text-sm text-gray-600">{formatDate(user.updated_at)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
