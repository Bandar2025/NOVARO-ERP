import { ApiErrorResponse, ApiSuccessResponse, ApiResponse, AppError, ApiErrorCode } from "../core/application/errors/ApiError";
import { ApiClientConfig, defaultApiConfig } from "./config";

export class ApiClient {
  private config: ApiClientConfig;

  constructor(config: Partial<ApiClientConfig> = {}) {
    this.config = { ...defaultApiConfig, ...config };
  }

  get mode(): "local" | "api" {
    return this.config.persistenceMode;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.config.timeoutMs);

    const url = endpoint.startsWith("http") || endpoint.startsWith("/api")
      ? endpoint
      : `${this.config.baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Accept": "application/json",
      ...((options.headers as Record<string, string>) || {})
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal
      });

      clearTimeout(timer);

      let body: any;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        body = await response.json();
      } else {
        const text = await response.text();
        body = { message: text };
      }

      if (!response.ok) {
        // Handle unified error format
        const errorData = (body && typeof body === "object" && body.error) 
          ? body.error 
          : { code: "INTERNAL_ERROR", message: body?.message || response.statusText };
        
        throw new AppError(
          (errorData.code as ApiErrorCode) || "INTERNAL_ERROR",
          errorData.message || `HTTP ${response.status} error`,
          response.status,
          errorData.details
        );
      }

      // If wrapped in success response envelope
      if (body && typeof body === "object" && body.success === true && "data" in body) {
        return body.data as T;
      }

      return body as T;
    } catch (err: any) {
      clearTimeout(timer);
      if (err instanceof AppError) {
        throw err;
      }
      if (err?.name === "AbortError") {
        throw new AppError("INTERNAL_ERROR", `Request timeout after ${this.config.timeoutMs}ms`, 408);
      }
      throw new AppError("INTERNAL_ERROR", err?.message || "Network request failed", 500);
    }
  }

  async get<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: "GET", headers });
  }

  async post<T>(endpoint: string, data?: unknown, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      headers,
      body: data !== undefined ? JSON.stringify(data) : undefined
    });
  }

  async put<T>(endpoint: string, data?: unknown, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      headers,
      body: data !== undefined ? JSON.stringify(data) : undefined
    });
  }

  async delete<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE", headers });
  }
}

export const apiClient = new ApiClient();
