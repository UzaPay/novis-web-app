import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

// Base URL - defaults to localhost:4000 (as per your API README)
const API_BASE_URL =
  import.meta.env.VITE_API_URL 

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-Requested-With": "novis-web-app"
  },
  timeout: 120_000,
  withCredentials: false,
});

// Request interceptor to add auth tokens
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const accessToken = localStorage.getItem("access_token");
    const refreshToken = localStorage.getItem("refresh_token");

    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    // refresh token header for auto-refresh
    if (refreshToken && config.headers) {
      config.headers["x-refresh-token"] = refreshToken;
    }

    config.headers["X-Requested-With"] = "novis-web-app";

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

// Response interceptor to handle errors and token refresh
apiClient.interceptors.response.use(
  (response) => {
    // If new tokens are returned, update localStorage
    // if (response.data?.access_token) {
    //   localStorage.setItem('access_token', response.data.access_token)
    // }
    // Server may transparently rotate access token
    const hasNewToken = response.headers["x-has-new-token"] === "true";
    const newToken = response.headers["x-access-token"];

    if (hasNewToken && newToken) {
      localStorage.setItem("access_token", newToken);
    }
    if (response.data?.refresh_token) {
      localStorage.setItem("refresh_token", response.data.refresh_token);
    }
    return response;
  },
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Clear auth and redirect to login
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default apiClient;
