export interface DatabaseUser {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: "admin" | "editor" | "translator";
  created_at: string;
  updated_at: string;
}

export interface CreateUserData {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: "admin" | "editor" | "translator";
}

export interface DatabaseResponse<T> {
  data: T | null;
  error: string | null;
}

export const TABLES = {
  USERS: "users",
} as const;
