import { useState, useEffect } from "react";
import { FiPlus } from "react-icons/fi";
import { usersApi } from "../services/usersApi";
import type { DatabaseUser } from "../types/database";
import EditUserModal from "../components/Modals/EditUserModal";
import { SectionLoadingSpinner, ErrorState } from "../components/common";
import { ResponsivePageHeader } from "../components/Header/PageHeader";
import { UserTable } from "../components/Lists";

export default function Users() {
  const [users, setUsers] = useState<DatabaseUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<DatabaseUser | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch users using API service
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await usersApi.getAllUsers();

      if (result.error) {
        setError(result.error);
        return;
      }

      setUsers(result.data || []);
    } catch (err) {
      console.error("Unexpected error fetching users:", err);
      setError("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

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

  const handleDeleteUser = (userId: string) => {
    // TODO: Implement delete user functionality
    console.log("Delete user:", userId);
  };

  const handleSaveUserRole = async (
    userId: string,
    newRole: "admin" | "editor" | "translator"
  ) => {
    try {
      const result = await usersApi.updateUserRole(userId, newRole);

      if (result.error) {
        console.error("Failed to update user role:", result.error);
        // TODO: Show error toast/notification
        return;
      }

      // Update the user in the local state
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId
            ? { ...user, role: newRole, updated_at: new Date().toISOString() }
            : user
        )
      );

      console.log("User role updated successfully");
      // TODO: Show success toast/notification
    } catch (error) {
      console.error("Unexpected error updating user role:", error);
      // TODO: Show error toast/notification
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
        users={users}
        onEditUser={handleEditUser}
        onDeleteUser={handleDeleteUser}
        getRoleBadgeColor={getRoleBadgeColor}
      />

      {/* Edit User Modal */}
      <EditUserModal
        user={editingUser}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveUserRole}
      />
    </div>
  );
}
