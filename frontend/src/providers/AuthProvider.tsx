import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { User, AuthContextType } from "../types/auth";
import { AuthContext } from "../contexts/AuthContext";
import { userService } from "../services/userService";
import type { Session } from "@supabase/supabase-js";

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const createUserInDatabase = async (session: Session) => {
    try {
      const token = session.access_token;
      const userData = {
        user_id: session.user.id,
        email: session.user.email || "",
        name: session.user.email?.split("@")[0] || "User",
        role: "translator" as const,
        avatar_url: session.user.user_metadata?.avatar_url,
      };

      await userService.createUser(userData, token);
    } catch (error) {
      // If user already exists, that's fine - just log it
      if (error instanceof Error && error.message.includes("already exists")) {
        console.log("User already exists in database");
      } else {
        console.error("Error creating user in database:", error);
      }
    }
  };

  const getUserFromDatabase = async (session: Session): Promise<User> => {
    try {
      const token = session.access_token;
      const userResponse = await userService.getCurrentUserProfile(token);
      return userService.convertToUser(userResponse);
    } catch (error) {
      console.error("Error fetching user from database:", error);
      // Fallback to session data
      return {
        id: session.user.id,
        email: session.user.email || "",
        name: session.user.email?.split("@")[0] || "User",
        avatar_url: session.user.user_metadata?.avatar_url,
        role: "translator", // Default role
      };
    }
  };

  useEffect(() => {
    // Check for existing session
    const getSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          const userData = await getUserFromDatabase(session);
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Error getting session:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (session?.user && event === "SIGNED_IN") {
          // For new signups, create user in database
          await createUserInDatabase(session);

          // Get user data from database
          const userData = await getUserFromDatabase(session);
          setUser(userData);
        } else if (session?.user && event === "TOKEN_REFRESHED") {
          // For token refresh, only update user data if we don't have it or if it's stale
          if (!user) {
            const userData = await getUserFromDatabase(session);
            setUser(userData);
          }
        } else if (event === "SIGNED_OUT") {
          setUser(null);
        }
      } catch (error) {
        console.error("💥 Error in auth state change:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        const userData = await getUserFromDatabase(session);
        setUser(userData);
      }
    } catch (error) {
      console.error("Error refreshing user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
