import { useState, useEffect, useCallback } from "react";
import { FiPlus } from "react-icons/fi";
import type { MockUser } from "../data/mockData";
import EditUserModal from "../components/Modals/EditUserModal";
import { SectionLoadingSpinner, ErrorState } from "../components/common";
import { ResponsivePageHeader } from "../components/Header/PageHeader";
import { UserTable } from "../components/Lists";
import { userService, type UserResponse } from "../services/userService";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabase";

export default function Users() {
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<UserResponse | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user: currentUser } = useAuth();

  // Convert UserResponse to MockUser for compatibility with existing components
  const convertToMockUser = (user: UserResponse): MockUser => ({
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar_url || null,
    role: user.role,
    created_at: user.created_at,
    updated_at: user.updated_at,
  });

  // Fetch users from API
  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!currentUser) {
        setError("Authentication required");
        setIsLoading(false);
        return;
      }

      // Get access token from Supabase
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError("No valid session found");
        setIsLoading(false);
        return;
      }

      const usersData = await userService.getUsers(session.access_token);
      setUsers(usersData);
      setIsLoading(false);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const getRoleBadgeColor = (role: string) => {
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

  const handleAddUser = () => {
    // TODO: Implement add user functionality
    console.log("Add user clicked");
  };

  const handleEditUser = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (user) {
      setEditingUser(user);
      setIsModalOpen(true);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      if (!currentUser) {
        setError("Authentication required");
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError("No valid session found");
        return;
      }

      await userService.deleteUser(userId, session.access_token);

      // Remove user from local state
      setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));
      console.log("User deleted successfully");
    } catch (error) {
      console.error("Error deleting user:", error);
      setError(
        error instanceof Error ? error.message : "Failed to delete user"
      );
    }
  };

  const handleSaveUserRole = async (
    userId: string,
    newRole: "admin" | "editor" | "translator"
  ) => {
    try {
      if (!currentUser) {
        setError("Authentication required");
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError("No valid session found");
        return;
      }

      const updatedUser = await userService.updateUserRole(
        userId,
        newRole,
        session.access_token
      );

      // Update user in local state
      setUsers((prevUsers) =>
        prevUsers.map((user) => (user.id === userId ? updatedUser : user))
      );

      console.log("User role updated successfully");
    } catch (error) {
      console.error("Error updating user role:", error);
      setError(
        error instanceof Error ? error.message : "Failed to update user role"
      );
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Page Header */}
        <ResponsivePageHeader
          title="User Management"
          action={
            <button
              onClick={handleAddUser}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors w-full sm:w-auto cursor-pointer"
            >
              <FiPlus className="text-sm" />
              <span className="sm:inline">Add User</span>
            </button>
          }
        />

        {/* Loading State */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <SectionLoadingSpinner text="Loading users..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <ResponsivePageHeader
          title="User Management"
          action={
            <button
              onClick={handleAddUser}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors w-full sm:w-auto cursor-pointer"
            >
              <FiPlus className="text-sm" />
              <span className="sm:inline">Add User</span>
            </button>
          }
        />
        <ErrorState error={error} onRetry={fetchUsers} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <ResponsivePageHeader
        title="User Management"
        action={
          <button
            onClick={handleAddUser}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors w-full sm:w-auto cursor-pointer"
          >
            <FiPlus className="text-sm" />
            <span className="sm:inline">Add User</span>
          </button>
        }
      />

      {/* Users Table */}
      <UserTable
        users={users.map(convertToMockUser)}
        onEditUser={handleEditUser}
        onDeleteUser={handleDeleteUser}
        getRoleBadgeColor={getRoleBadgeColor}
      />

      {/* Edit User Modal */}
      <EditUserModal
        user={editingUser ? convertToMockUser(editingUser) : null}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveUserRole}
      />
    </div>
  );
}
