import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from "axios";
import { tokenManager } from "./token-manager";
import type { RefreshTokenResponse } from "@/types/auth";
import { toast } from "sonner";

export class ApiError extends Error {
  status?: number;
  code?: string;
  details?: unknown;

  constructor(message: string, status?: number, code?: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// Create axios instance with base configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}/api/v1`,
  timeout: 10000,
  withCredentials: true, // Essential for cookie-based auth (refresh token)
  headers: {
    "Content-Type": "application/json",
  },
});

// Track ongoing refresh requests to prevent multiple simultaneous refreshes
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: AxiosError | null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(null);
    }
  });

  failedQueue = [];
};

// Request interceptor for authentication
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = tokenManager.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log request in development
    if (process.env.NODE_ENV === "development") {
      console.log("🚀 API Request:", {
        method: config.method?.toUpperCase(),
        url: config.url,
        data: config.data,
        hasToken: !!token,
      });
    }

    return config;
  },
  (error) => {
    console.error("❌ Request Error:", error);
    toast.error("Request failed");
    return Promise.reject(error);
  }
);

// Response interceptor for handling responses and errors
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log response in development
    if (process.env.NODE_ENV === "development") {
      console.log("✅ API Response:", {
        status: response.status,
        url: response.config.url,
        data: response.data,
      });
    }

    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    // Handle 401 errors with token refresh (but skip if this is a refresh call itself)
    // Also skip for login and refresh endpoints as they should not trigger token refresh
    const isAuthEndpoint =
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/refresh");

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint &&
      !(originalRequest as AxiosRequestConfig & { skipAuthRetry?: boolean }).skipAuthRetry
    ) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Perform token refresh
        await performTokenRefresh();

        // Retry the original request with new token
        const token = tokenManager.getAccessToken();
        if (token && originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          processQueue(null);
          return apiClient(originalRequest);
        } else {
          throw new Error("Token refresh failed");
        }
      } catch (refreshError) {
        processQueue(refreshError as AxiosError);
        handleAuthFailure();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    console.log("error", error);

    // Handle other errors
    let message = "An unexpected error occurred";
    const status = error.response?.status;
    let code: string | undefined;
    let details: unknown;

    if (error.response) {
      const { status, data } = error.response;

      // Backend returns errors in format: { error: { code, message }, timestamp, path }
      const errorData = data as {
        error?: {
          code?: string;
          message?: string;
        };
        message?: string;
        errors?: unknown;
        detail?: string;
      };

      console.log("errorData", errorData);

      // Try to extract message from backend error format first
      if (errorData?.error?.message) {
        message = errorData.error.message;
        code = errorData.error.code;
      } else {
        // Fallback to generic messages
        switch (status) {
          case 400:
            message = errorData?.message || errorData?.detail || "Bad request";
            break;
          case 401:
            message = errorData?.message || errorData?.detail || "Unauthorized";
            break;
          case 403:
            message =
              errorData?.message || errorData?.detail || "Forbidden - Insufficient permissions";
            break;
          case 404:
            message = errorData?.message || errorData?.detail || "Resource not found";
            break;
          case 409:
            message = errorData?.message || errorData?.detail || "Resource already exists";
            break;
          case 422:
            message = errorData?.message || "Validation error";
            details = errorData?.errors;
            break;
          case 500:
            message = errorData?.message || errorData?.detail || "Internal server error";
            break;
          default:
            message = errorData?.message || errorData?.detail || `Error ${status}`;
        }
      }
    } else if (error.request) {
      message = "Network error - Please check your connection";
    }

    const apiError = new ApiError(message, status, code, details);

    // Show toast notification for errors (except 401 which is handled automatically)
    // if (error.response?.status !== 401) {
    //   toast.error(apiError.message);
    // }

    console.error("❌ API Error:", apiError);
    return Promise.reject(apiError);
  }
);

// Centralized token refresh function
async function performTokenRefresh(): Promise<void> {
  const response = await apiClient.post<RefreshTokenResponse>("/auth/refresh");
  const { accessToken, expiresIn } = response.data;

  // Update tokens in manager
  tokenManager.updateAccessToken(accessToken, expiresIn);

  if (process.env.NODE_ENV === "development") {
    console.log("🔄 Tokens refreshed successfully");
    toast.success("DEV-Tokens refreshed successfully");
  }
}

// Handle authentication failure (redirect to login)
function handleAuthFailure(): void {
  tokenManager.clearTokens();
  toast.error("Authentication failed. Please login again.");

  if (typeof window !== "undefined") {
    // Only redirect if not already on login page
    if (!window.location.pathname.includes("/auth/login")) {
      window.location.href = "/auth/login";
    }
  }
}

// Helper functions for different HTTP methods
export const api = {
  get: <T = unknown>(url: string, config?: AxiosRequestConfig) => apiClient.get<T>(url, config),

  post: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    apiClient.post<T>(url, data, config),

  put: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    apiClient.put<T>(url, data, config),

  patch: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    apiClient.patch<T>(url, data, config),

  delete: <T = unknown>(url: string, config?: AxiosRequestConfig) =>
    apiClient.delete<T>(url, config),
};

export default apiClient;
