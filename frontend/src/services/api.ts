// API configuration and base client
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

export interface ApiError {
  success: false;
  message: string;
  error_code?: string;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const config: RequestInit = {
      headers: {
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // Log detailed error information for debugging
        console.error(`❌ API Error ${response.status}:`, {
          url,
          status: response.status,
          statusText: response.statusText,
          errorData,
          requestBody: config.body,
        });

        // For 422 validation errors, include more details
        if (response.status === 422 && errorData.detail) {
          throw new Error(
            `Validation error: ${JSON.stringify(errorData.detail)}`
          );
        }

        throw new Error(
          errorData.message ||
            errorData.detail ||
            `HTTP error! status: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }

  private getAuthHeaders(token?: string): Record<string, string> {
    if (!token) return {};
    return {
      Authorization: `Bearer ${token}`,
    };
  }

  async get<T>(endpoint: string, token?: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: "GET",
      headers: {
        ...this.getAuthHeaders(token),
      },
    });
  }

  async post<T>(endpoint: string, data?: unknown, token?: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...this.getAuthHeaders(token),
      },
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown, token?: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...this.getAuthHeaders(token),
      },
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string, token?: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: "DELETE",
      headers: {
        ...this.getAuthHeaders(token),
      },
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
