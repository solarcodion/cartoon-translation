import { useState, useEffect, useCallback } from "react";

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
import EditUserModal from "../components/Modals/EditUserModal";
import DeleteUserModal from "../components/Modals/DeleteUserModal";
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
  const [deletingUser, setDeletingUser] = useState<UserResponse | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
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

  const handleEditUser = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (user) {
      setEditingUser(user);
      setIsModalOpen(true);
    }
  };

  const handleDeleteUser = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (user) {
      setDeletingUser(user);
      setIsDeleteModalOpen(true);
    }
  };

  const handleConfirmDelete = async (userId: string) => {
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
    } catch (error) {
      console.error("Error deleting user:", error);
      setError(
        error instanceof Error ? error.message : "Failed to delete user"
      );
      throw error; // Re-throw to let the modal handle the error
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

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeletingUser(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Page Header */}
        <ResponsivePageHeader title="User Management" />

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
        <ResponsivePageHeader title="User Management" />
        <ErrorState error={error} onRetry={fetchUsers} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <ResponsivePageHeader title="User Management" />

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

      {/* Delete User Modal */}
      <DeleteUserModal
        user={deletingUser ? convertToMockUser(deletingUser) : null}
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onDelete={handleConfirmDelete}
      />
    </div>
  );
}
