import apiClient from "./api-client";
import { AuthResponse, User } from "@/types";

class AuthService {
  private readonly ACCESS_TOKEN_KEY = "access_token";
  private readonly REFRESH_TOKEN_KEY = "refresh_token";
  private readonly USER_KEY = "user";

  async login(username: string, password: string): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>("/auth/v1/login", {
        username,
        password,
      });

      const { user, access_token, refresh_token, role } = response.data;

      if (!["SuperAdmin", "Investor"].includes(role)) {
        throw new Error(
          "Unauthorized: You do not have the credentials to access this service.",
        );
      }

      // Store auth data
      localStorage.setItem(this.ACCESS_TOKEN_KEY, access_token);
      if (refresh_token) {
        localStorage.setItem(this.REFRESH_TOKEN_KEY, refresh_token);
      }
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  logout(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    window.location.href = "/login";
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  getUser(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  isSuperAdmin(): boolean {
    const user = this.getUser();
    return user?.role === "SuperAdmin";
  }
}

export const authService = new AuthService();
