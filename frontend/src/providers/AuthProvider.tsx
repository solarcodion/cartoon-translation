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
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        const userData: User = {
          id: session.user.id,
          email: session.user.email || "",
          display_name:
            session.user.user_metadata?.name ||
            session.user.email?.split("@")[0],
          avatar_url: session.user.user_metadata?.avatar_url,
        };
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
      } else {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch (error) {
            console.error("Error parsing stored user:", error);
            localStorage.removeItem("user");
          }
        }
      }
      setIsLoading(false);
    };

    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const userData: User = {
          id: session.user.id,
          email: session.user.email || "",
          display_name:
            session.user.user_metadata?.display_name ||
            session.user.email?.split("@")[0],
          avatar_url: session.user.user_metadata?.avatar_url,
        };
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
      } else {
        setUser(null);
        localStorage.removeItem("user");
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Logout error:", error);
    }
    setUser(null);
    localStorage.removeItem("user");
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
