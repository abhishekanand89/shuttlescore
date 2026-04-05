const API_BASE = import.meta.env.PROD ? "/api" : "http://localhost:8000/api";

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

/* --- Match Types --- */

export interface GameState {
  game_number: number;
  score_a: number;
  score_b: number;
  server_id: string;
  serving_side: "a" | "b";
}

export interface MatchData {
  id: string;
  match_type: "singles" | "doubles";
  status: "in_progress" | "completed";
  team_a: { players: {id: string, name: string}[]; games_won: number; player_names?: string[] };
  team_b: { players: {id: string, name: string}[]; games_won: number; player_names?: string[] };
  current_game?: GameState;
  games: any[];
  points: any[];
  winner_side?: "a" | "b" | null;
  created_at: string;
  current_score?: {a: number, b: number};
}

export interface ActiveMatchListItem extends MatchData {
  current_score: {a: number, b: number};
}

export interface CreateMatchData {
  match_type: "singles" | "doubles";
  team_a_player_ids: string[];
  team_b_player_ids: string[];
  first_server_id: string;
}

/* --- Match API --- */

export const matchApi = {
  list: (status?: string) =>
    request<MatchData[]>(`/matches${status ? `?status=${status}` : ""}`),
  get: (id: string) => request<MatchData>(`/matches/${id}`),
  create: (data: CreateMatchData) =>
    request<MatchData>("/matches", { method: "POST", body: JSON.stringify(data) }),
  scorePoint: (id: string, side: "a" | "b") =>
    request<{point: any, current_game: GameState, game_ended: boolean, match_ended: boolean, winner_side: string}>(
      `/matches/${id}/points`, { method: "POST", body: JSON.stringify({ scoring_side: side }) }
    ),
  undoPoint: (id: string) =>
    request<{undone: boolean, current_game: GameState, game_restored: boolean}>(
      `/matches/${id}/undo`, { method: "POST" }
    )
};

/* --- Health API --- */

export const healthApi = {
  check: () => request<{ status: string; version: string }>("/health"),
};
