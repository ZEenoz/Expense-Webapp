/**
 * Centralized API Client for Expense Webapp
 * Handles x-user-id header and consistent response formatting
 */

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export async function apiClient<T>(
  url: string,
  options: RequestInit = {},
  token?: string | null
): Promise<ApiResponse<T>> {
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const json = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: json.error || `HTTP error! status: ${response.status}`,
      };
    }

    return json as ApiResponse<T>;
  } catch (error: any) {
    console.error(`API Call failed (${url}):`, error);
    return {
      success: false,
      error: error.message || "Unknown network error",
    };
  }
}
