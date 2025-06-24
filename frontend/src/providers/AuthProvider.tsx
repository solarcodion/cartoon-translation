import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { User, AuthContextType } from "../types/auth";
import { AuthContext } from "../contexts/AuthContext";

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const getSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          const userData: User = {
            id: session.user.id,
            email: session.user.email || "",
            name:
              session.user.user_metadata?.display_name ||
              session.user.user_metadata?.full_name ||
              session.user.email?.split("@")[0] ||
              "Unknown User",
            avatar_url: session.user.user_metadata?.avatar_url,
            role: "translator", // Default role for frontend display
          };
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
        if (
          session?.user &&
          (event === "SIGNED_IN" || event === "TOKEN_REFRESHED")
        ) {
          const userData: User = {
            id: session.user.id,
            email: session.user.email || "",
            name:
              session.user.user_metadata?.display_name ||
              session.user.user_metadata?.full_name ||
              session.user.email?.split("@")[0] ||
              "Unknown User",
            avatar_url: session.user.user_metadata?.avatar_url,
            role: "translator", // Default role for frontend display
          };

          setUser(userData);
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

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
