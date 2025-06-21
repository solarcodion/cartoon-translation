// Authentication related types

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  role?: "admin" | "editor" | "translator";
  created_at?: string;
  updated_at?: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
}
