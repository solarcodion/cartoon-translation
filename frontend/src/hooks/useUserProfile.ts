import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { userService } from "../services/database";
import type { User } from "../types/auth";

export const useUserProfile = () => {
  const { user: authUser, isLoading: authLoading } = useAuth();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!authUser) {
        setProfileUser(null);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Fetch additional user data from database
        const result = await userService.getById(authUser.id);

        if (result.error) {
          console.warn("Could not fetch user profile from database:", result.error);
          // Fall back to auth user data only
          setProfileUser(authUser);
        } else if (result.data) {
          // Merge auth data with database data
          const enhancedUser: User = {
            id: authUser.id,
            email: authUser.email,
            name: authUser.name,
            avatar_url: authUser.avatar_url,
            role: result.data.role,
            created_at: result.data.created_at,
            updated_at: result.data.updated_at,
          };
          setProfileUser(enhancedUser);
        } else {
          // No database record found, use auth data only
          setProfileUser(authUser);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setError("Failed to load profile data");
        // Fall back to auth user data
        setProfileUser(authUser);
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading) {
      fetchUserProfile();
    }
  }, [authUser, authLoading]);

  return {
    user: profileUser,
    isLoading: authLoading || isLoading,
    error,
  };
};
