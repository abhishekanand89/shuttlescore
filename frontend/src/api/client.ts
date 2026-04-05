const API_BASE = "http://localhost:8000/api";

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface ApiError {
  detail: string;
}

/**
 * Generic fetch wrapper with error handling.
 * Returns typed data on success, throws on error.
 */
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const config: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      detail: `Request failed with status ${response.status}`,
    }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  const json: ApiResponse<T> = await response.json();
  return json.data;
}

/* --- Player Types --- */

export interface Player {
  id: string;
  name: string;
  phone: string;
  created_at: string;
}

export interface PlayerListItem {
  id: string;
  name: string;
  phone_masked: string;
}

export interface CreatePlayerData {
  name: string;
  phone: string;
}

export interface UpdatePlayerData {
  name?: string;
}

/* --- Player API --- */

export const playerApi = {
  list: (search?: string) =>
    request<PlayerListItem[]>(
      `/players${search ? `?search=${encodeURIComponent(search)}` : ""}`
    ),

  get: (id: string) => request<Player>(`/players/${id}`),

  create: (data: CreatePlayerData) =>
    request<Player>("/players", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: UpdatePlayerData) =>
    request<Player>(`/players/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};

/* --- Health API --- */

export const healthApi = {
  check: () => request<{ status: string; version: string }>("/health"),
};
