import { supabase } from "../lib/supabase";
import type {
  DatabaseUser,
  CreateUserData,
  DatabaseResponse,
} from "../types/database";
import { TABLES } from "../types/database";

// User service functions
export const userService = {
  // Get user by ID
  async getById(id: string): Promise<DatabaseResponse<DatabaseUser>> {
    try {
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("❌ Database error:", error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      console.error("💥 Unexpected error getting user:", error);
      return { data: null, error: "An unexpected error occurred" };
    }
  },

  // Check if user exists by ID
  async existsById(id: string): Promise<DatabaseResponse<boolean>> {
    try {
      const { error, count } = await supabase
        .from(TABLES.USERS)
        .select("id", { count: "exact" })
        .eq("id", id);

      if (error) {
        console.error("❌ Database error:", error);
        // If it's a 406 error or table access issue, assume user doesn't exist
        if (error.code === "PGRST116" || error.message.includes("406")) {
          return { data: false, error: null };
        }
        return { data: null, error: error.message };
      }

      const exists = (count || 0) > 0;
      return { data: exists, error: null };
    } catch (error) {
      console.error("💥 Unexpected error checking user existence:", error);
      return { data: null, error: "An unexpected error occurred" };
    }
  },

  // Get all users
  async getAll(): Promise<DatabaseResponse<DatabaseUser[]>> {
    try {
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ Database error:", error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      console.error("💥 Unexpected error getting users:", error);
      return { data: null, error: "An unexpected error occurred" };
    }
  },

  // Update user role
  async updateRole(
    userId: string,
    newRole: "admin" | "editor" | "translator"
  ): Promise<DatabaseResponse<DatabaseUser>> {
    try {
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .update({
          role: newRole,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .select()
        .single();

      if (error) {
        console.error("❌ Database error:", error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      console.error("💥 Unexpected error updating user role:", error);
      return { data: null, error: "An unexpected error occurred" };
    }
  },

  // Create new user with simplified approach
  async create(
    userData: CreateUserData
  ): Promise<DatabaseResponse<DatabaseUser>> {
    try {
      // Simplified insert data - only include essential fields
      const insertData: Partial<DatabaseUser> = {
        name: userData.name,
        email: userData.email,
        role: userData.role,
      };

      // Only include ID if provided (for auth users)
      if (userData.id) {
        insertData.id = userData.id;
      }

      // Only include avatar if provided and not empty
      if (userData.avatar && userData.avatar.trim() !== "") {
        insertData.avatar = userData.avatar;
      }

      // Try different insert approaches
      let result;
      let error;

      // Approach 1: Simple insert without timestamps (let DB handle them)
      try {
        const response = await supabase
          .from(TABLES.USERS)
          .insert([insertData])
          .select()
          .single();

        result = response.data;
        error = response.error;
      } catch (catchError) {
        console.error("❌ Error inserting user:", catchError);

        const insertDataWithTimestamps = {
          ...insertData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const response = await supabase
          .from(TABLES.USERS)
          .insert([insertDataWithTimestamps])
          .select()
          .single();

        result = response.data;
        error = response.error;
      }

      if (error) {
        console.error("❌ Database error creating user:", error);
        console.error("🔍 Full error details:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });

        // Check for specific error types
        if (error.code === "23505") {
          return {
            data: null,
            error: "User already exists with this email or ID",
          };
        }
        if (error.code === "42501") {
          return {
            data: null,
            error: "Permission denied - check RLS policies",
          };
        }

        return { data: null, error: `Database error: ${error.message}` };
      }

      return { data: result, error: null };
    } catch (error) {
      console.error("💥 Unexpected error creating user:", error);
      return { data: null, error: "An unexpected error occurred" };
    }
  },
};
