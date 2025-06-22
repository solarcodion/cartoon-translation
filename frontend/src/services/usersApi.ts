import { userService } from "./database";
import type { DatabaseUser, DatabaseResponse } from "../types/database";

/**
 * Users API Service
 * Provides a clean API interface for user-related operations
 */
export const usersApi = {
  /**
   * Fetch all users from the database
   * @returns Promise with users data or error
   */
  async getAllUsers(): Promise<DatabaseResponse<DatabaseUser[]>> {
    try {
      const result = await userService.getAll();

      if (result.error) {
        console.error("Failed to fetch users:", result.error);
        return {
          data: null,
          error:
            "Failed to load users. Please check your connection and try again.",
        };
      }

      return {
        data: result.data || [],
        error: null,
      };
    } catch (error) {
      console.error("Unexpected error in getAllUsers:", error);
      return {
        data: null,
        error: "An unexpected error occurred while loading users.",
      };
    }
  },

  /**
   * Get a specific user by ID
   * @param userId - The user ID to fetch
   * @returns Promise with user data or error
   */
  async getUserById(userId: string): Promise<DatabaseResponse<DatabaseUser>> {
    try {
      const result = await userService.getById(userId);

      if (result.error) {
        console.error("Failed to fetch user:", result.error);
        return {
          data: null,
          error: "Failed to load user. Please try again.",
        };
      }

      return result;
    } catch (error) {
      console.error("Unexpected error in getUserById:", error);
      return {
        data: null,
        error: "An unexpected error occurred while loading user.",
      };
    }
  },

  /**
   * Create a new user
   * @param userData - The user data to create
   * @returns Promise with created user data or error
   */
  async createUser(userData: {
    id: string;
    name: string;
    email: string;
    avatar: string;
    role: "admin" | "editor" | "translator";
  }): Promise<DatabaseResponse<DatabaseUser>> {
    try {
      const result = await userService.create(userData);

      if (result.error) {
        console.error("Failed to create user:", result.error);
        return {
          data: null,
          error: "Failed to create user. Please try again.",
        };
      }

      return result;
    } catch (error) {
      console.error("Unexpected error in createUser:", error);
      return {
        data: null,
        error: "An unexpected error occurred while creating user.",
      };
    }
  },

  /**
   * Update user role
   * @param userId - The user ID to update
   * @param newRole - The new role to assign
   * @returns Promise with updated user data or error
   */
  async updateUserRole(
    userId: string,
    newRole: "admin" | "editor" | "translator"
  ): Promise<DatabaseResponse<DatabaseUser>> {
    try {
      const result = await userService.updateRole(userId, newRole);

      if (result.error) {
        console.error("Failed to update user role:", result.error);
        return {
          data: null,
          error: "Failed to update user role. Please try again.",
        };
      }

      return result;
    } catch (error) {
      console.error("Unexpected error in updateUserRole:", error);
      return {
        data: null,
        error: "An unexpected error occurred while updating user role.",
      };
    }
  },

  /**
   * Check if a user exists by ID
   * @param userId - The user ID to check
   * @returns Promise with boolean result or error
   */
  async userExists(userId: string): Promise<DatabaseResponse<boolean>> {
    try {
      const result = await userService.existsById(userId);

      if (result.error) {
        console.error("Failed to check user existence:", result.error);
        return {
          data: null,
          error: "Failed to check user existence. Please try again.",
        };
      }

      return result;
    } catch (error) {
      console.error("Unexpected error in userExists:", error);
      return {
        data: null,
        error: "An unexpected error occurred while checking user existence.",
      };
    }
  },
};
