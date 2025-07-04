import { apiClient, type ApiResponse } from "./api";
import type { User } from "../types/auth";

export interface CreateUserRequest {
  user_id: string;
  email: string;
  name: string;
  role?: "admin" | "editor" | "translator";
  avatar_url?: string;
}

export interface UpdateProfileRequest {
  name?: string;
  avatar_url?: string;
}

export interface UpdateRoleRequest {
  role: "admin" | "editor" | "translator";
}

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  role: "admin" | "editor" | "translator";
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

class UserService {
  /**
   * Create a new user in the database after Supabase auth signup
   */
  async createUser(
    userData: CreateUserRequest,
    token: string
  ): Promise<UserResponse> {
    return apiClient.post<UserResponse>("/users/", userData, token);
  }

  /**
   * Get all users with pagination
   */
  async getUsers(
    token: string,
    limit = 100,
    offset = 0
  ): Promise<UserResponse[]> {
    return apiClient.get<UserResponse[]>(
      `/users/?limit=${limit}&offset=${offset}`,
      token
    );
  }

  /**
   * Get current user's profile
   */
  async getCurrentUserProfile(token: string): Promise<UserResponse> {
    return apiClient.get<UserResponse>("/users/me", token);
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string, token: string): Promise<UserResponse> {
    return apiClient.get<UserResponse>(`/users/${userId}`, token);
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string, token: string): Promise<UserResponse> {
    return apiClient.get<UserResponse>(`/users/email/${email}`, token);
  }

  /**
   * Update current user's own profile (name and avatar)
   */
  async updateMyProfile(
    profileData: UpdateProfileRequest,
    token: string
  ): Promise<UserResponse> {
    return apiClient.put<UserResponse>("/users/me", profileData, token);
  }

  /**
   * Update user role specifically
   */
  async updateUserRole(
    userId: string,
    role: "admin" | "editor" | "translator",
    token: string
  ): Promise<UserResponse> {
    const roleData: UpdateRoleRequest = { role };
    return apiClient.put<UserResponse>(
      `/users/${userId}/role`,
      roleData,
      token
    );
  }

  /**
   * Delete user
   */
  async deleteUser(userId: string, token: string): Promise<ApiResponse> {
    return apiClient.delete<ApiResponse>(`/users/${userId}`, token);
  }

  /**
   * Convert UserResponse to User type for frontend compatibility
   */
  convertToUser(userResponse: UserResponse): User {
    return {
      id: userResponse.id,
      email: userResponse.email,
      name: userResponse.name,
      role: userResponse.role,
      avatar_url: userResponse.avatar_url,
      created_at: userResponse.created_at,
      updated_at: userResponse.updated_at,
    };
  }
}

export const userService = new UserService();
