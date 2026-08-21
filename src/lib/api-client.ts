/**
 * Express REST API Client for TaskFlow
 * Connects frontend directly to the Node.js + Express + MongoDB backend (http://localhost:5000/api)
 */

import type { Task, TaskInput, TaskPriority, TaskStatus, SortKey } from "./tasks";
import type { Analytics } from "./analytics";

const API_BASE = (import.meta.env["VITE_API_URL"] as string) || "http://localhost:5000/api";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("taskflow_token");
}

export function setToken(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("taskflow_token", token);
  }
}

export function clearToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("taskflow_token");
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;

  if (!response.ok) {
    const errorMsg =
      typeof data["message"] === "string"
        ? data["message"]
        : `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

// Auth API
export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    request<{ success: boolean; token: string; user: AuthUser }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    request<{ success: boolean; token: string; user: AuthUser }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  googleAuth: (data: { name?: string; email: string }) =>
    request<{ success: boolean; token: string; user: AuthUser }>("/auth/google", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getMe: () => request<{ success: boolean; user: AuthUser }>("/auth/me"),
};

// Tasks API
export const tasksApi = {
  list: (params: {
    search?: string;
    status?: TaskStatus | "all";
    priority?: TaskPriority | "all";
    sort?: SortKey;
    page?: number;
    limit?: number;
  }) => {
    const query = new URLSearchParams();
    if (params.search) query.set("search", params.search);
    if (params.status && params.status !== "all") query.set("status", params.status);
    if (params.priority && params.priority !== "all") query.set("priority", params.priority);
    if (params.sort) query.set("sort", params.sort);
    if (params.page) query.set("page", params.page.toString());
    if (params.limit) query.set("limit", params.limit.toString());

    return request<{ success: boolean; tasks: Task[]; total: number; page: number; pages: number }>(
      `/tasks?${query.toString()}`,
    );
  },

  create: (task: TaskInput) =>
    request<{ success: boolean; task: Task }>("/tasks", {
      method: "POST",
      body: JSON.stringify(task),
    }),

  getById: (id: string) => request<{ success: boolean; task: Task }>(`/tasks/${id}`),

  update: (id: string, task: Partial<TaskInput>) =>
    request<{ success: boolean; task: Task }>(`/tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify(task),
    }),

  updateStatus: (id: string, status: TaskStatus) =>
    request<{ success: boolean; task: Task }>(`/tasks/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  delete: (id: string) =>
    request<{ success: boolean; message: string }>(`/tasks/${id}`, {
      method: "DELETE",
    }),

  seed: () =>
    request<{ success: boolean; message: string }>("/tasks/seed", {
      method: "POST",
    }),
};

// Analytics API
export const analyticsApi = {
  get: () => request<{ success: boolean; analytics: Analytics }>("/analytics"),
};
