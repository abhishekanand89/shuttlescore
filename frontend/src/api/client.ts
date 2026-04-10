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

export type Gender = "male" | "female" | "non_binary" | "prefer_not_to_say";
export type SkillLevel = "beginner" | "intermediate" | "advanced" | "competitive";

export interface Player {
  id: string;
  name: string;
  phone: string;
  age: number | null;
  gender: Gender | null;
  skill_level: SkillLevel | null;
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
  age?: number;
  gender?: Gender;
  skill_level?: SkillLevel;
}

export interface UpdatePlayerData {
  name?: string;
  age?: number;
  gender?: Gender;
  skill_level?: SkillLevel;
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

/* --- Tournament API --- */

export const tournamentApi = {
  list: (status?: string) =>
    request<TournamentData[]>(`/tournaments${status ? `?status=${status}` : ""}`),
  get: (id: string) => request<{tournament: TournamentData}>(`/tournaments/${id}`),
  create: (data: CreateTournamentData) =>
    request<TournamentData>("/tournaments", { method: "POST", body: JSON.stringify(data) }),
};

/* --- League / Season Types --- */

export interface LeaguePlayerItem {
  id: string;
  name: string;
}

export interface SeasonSummary {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: "upcoming" | "active" | "completed";
  match_count: number;
}

export interface LeagueData {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  players: LeaguePlayerItem[];
  seasons: SeasonSummary[];
}

export interface LeagueListItem {
  id: string;
  name: string;
  description: string | null;
  player_count: number;
  season_count: number;
  active_season: string | null;
  created_at: string;
}

export interface SeasonData {
  id: string;
  league_id: string;
  league_name: string;
  name: string;
  start_date: string;
  end_date: string;
  status: "upcoming" | "active" | "completed";
  match_count: number;
  created_at: string;
}

export interface CreateLeagueData {
  name: string;
  description?: string;
  player_ids?: string[];
}

export interface CreateSeasonData {
  name: string;
  start_date: string;
  end_date: string;
}

/* --- League API --- */

export const leagueApi = {
  list: () => request<LeagueListItem[]>("/leagues"),
  get: (id: string) => request<LeagueData>(`/leagues/${id}`),
  create: (data: CreateLeagueData) =>
    request<LeagueData>("/leagues", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: { name?: string; description?: string }) =>
    request<LeagueData>(`/leagues/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) =>
    request<{ deleted: boolean }>(`/leagues/${id}`, { method: "DELETE" }),
  addPlayers: (id: string, playerIds: string[]) =>
    request<LeagueData>(`/leagues/${id}/players`, { method: "POST", body: JSON.stringify({ player_ids: playerIds }) }),
  removePlayer: (id: string, playerId: string) =>
    request<LeagueData>(`/leagues/${id}/players/${playerId}`, { method: "DELETE" }),
  listSeasons: (leagueId: string) =>
    request<SeasonSummary[]>(`/leagues/${leagueId}/seasons`),
  createSeason: (leagueId: string, data: CreateSeasonData) =>
    request<SeasonData>(`/leagues/${leagueId}/seasons`, { method: "POST", body: JSON.stringify(data) }),
};

export const seasonApi = {
  get: (id: string) => request<SeasonData>(`/seasons/${id}`),
  update: (id: string, data: { name?: string; start_date?: string; end_date?: string }) =>
    request<SeasonData>(`/seasons/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) =>
    request<{ deleted: boolean }>(`/seasons/${id}`, { method: "DELETE" }),
  updateStatus: (id: string, status: string) =>
    request<SeasonData>(`/seasons/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  listActive: () => request<SeasonData[]>("/seasons/active"),
};

/* --- Match Types --- */

export interface PointData {
  scoring_side: "a" | "b" | "start";
  game_number: number;
  score_a_after: number;
  score_b_after: number;
  server_id: string;
}

/* --- Tournament Types --- */
export interface TournamentData {
  id: string;
  name: string;
  description?: string;
  status: "upcoming" | "active" | "completed";
  created_at: string;
}

export interface CreateTournamentData {
  name: string;
  description?: string;
  status: string;
}

export interface GameState {
  game_number: number;
  score_a: number;
  score_b: number;
  server_id: string;
  serving_side: "a" | "b";
}

export type TrackingLevel = "summary" | "sequence" | "detailed";

export type PointEndReason = "winner" | "unforced_error" | "forced_error" | "serve_error" | "net_error" | "line_out";
export type ShotType = "smash" | "drop" | "clear" | "lob" | "drive" | "net_shot" | "serve" | "flick" | "push" | "lift";

export interface PointDetail {
  id: number;
  scoring_side: "a" | "b" | "start";
  game_number: number;
  score_a_after: number;
  score_b_after: number;
  server_id: string;
  created_at: string;
  rally_duration_seconds: number | null;
  point_end_reason: PointEndReason | null;
  shot_type: ShotType | null;
  winning_player_id: string | null;
}

export interface PointMetadataUpdate {
  rally_duration_seconds?: number;
  point_end_reason?: PointEndReason;
  shot_type?: ShotType;
  winning_player_id?: string;
}

export interface GameScoreInput {
  score_a: number;
  score_b: number;
}

export interface MatchData {
  id: string;
  match_type: "singles" | "doubles";
  match_format: "bo1" | "bo3";
  status: "in_progress" | "completed";
  tracking_level: TrackingLevel;
  location_name: string | null;
  latitude: number | null;
  longitude: number | null;
  team_a: { players: {id: string, name: string}[]; games_won: number; player_names?: string[] };
  team_b: { players: {id: string, name: string}[]; games_won: number; player_names?: string[] };
  current_game?: GameState;
  games: any[];
  points: PointDetail[];
  winner_side?: "a" | "b" | null;
  tournament_id?: string;
  created_at: string;
  current_score?: {a: number, b: number};
}

export interface ActiveMatchListItem extends MatchData {
  current_score: {a: number, b: number};
}

export interface CreateMatchData {
  match_type: "singles" | "doubles";
  match_format?: "bo1" | "bo3";
  team_a_player_ids: string[];
  team_b_player_ids: string[];
  first_server_id: string;
  tournament_id?: string;
  season_id?: string;
  tracking_level?: TrackingLevel;
  location_name?: string;
  latitude?: number;
  longitude?: number;
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
    ),
  updatePointMetadata: (matchId: string, pointId: number, data: PointMetadataUpdate) =>
    request<{id: number, rally_duration_seconds: number | null, point_end_reason: string | null, shot_type: string | null, winning_player_id: string | null}>(
      `/matches/${matchId}/points/${pointId}`, { method: "PATCH", body: JSON.stringify(data) }
    ),
  submitSummary: (matchId: string, games: GameScoreInput[]) =>
    request<MatchData>(`/matches/${matchId}/summary`, { method: "POST", body: JSON.stringify({ games }) }),
};

/* --- Analytics Types --- */

export interface MatchStats {
  total: number;
  wins: number;
  losses: number;
  win_rate: number;
}

export interface GameStats {
  total: number;
  wins: number;
  losses: number;
}

export interface TournamentMedal {
  tournament_id: string;
  tournament_name: string;
  wins: number;
  losses: number;
  medal: "gold" | "silver" | "bronze";
}

export interface TournamentStats {
  participated: number;
  medals: TournamentMedal[];
}

export interface PlayerAnalytics {
  player_id: string;
  player_name: string;
  matches: MatchStats;
  games: GameStats;
  tournaments: TournamentStats;
}

export interface LeaderboardEntry {
  rank: number;
  player_id: string;
  player_name: string;
  matches_played: number;
  wins: number;
  losses: number;
  win_rate: number;
  avg_rally_duration_seconds: number | null;
  elo_rating: number;
  shapley_value: number | null;
}

export interface ShotBreakdown {
  shot_type: string;
  label: string;
  count: number;
  wins: number;
  win_rate: number;
}

export interface EndReasonBreakdown {
  reason: string;
  label: string;
  count: number;
  percentage: number;
}

export interface ShotAnalytics {
  total_detailed_points: number;
  avg_rally_duration_seconds: number | null;
  shots: ShotBreakdown[];
  end_reasons: EndReasonBreakdown[];
  serve_error_rate: number | null;
}

export interface ErrorProneShot {
  shot_type: string;
  label: string;
  error_count: number;
  total_count: number;
  error_rate: number;
}

export interface ErrorProneShotAnalytics {
  total_error_points: number;
  shots: ErrorProneShot[];
}

export interface PartnershipSynergy {
  partner_id: string;
  partner_name: string;
  matches_together: number;
  wins_together: number;
  pair_win_rate: number;
  expected_win_rate: number;
  synergy: number;
}

export interface ShapleyAnalytics {
  player_id: string;
  player_name: string;
  shapley_value: number;
  doubles_shapley: number | null;
  singles_contribution: number | null;
  doubles_matches: number;
  singles_matches: number;
  partnerships_analyzed: number;
  partnerships: PartnershipSynergy[];
}

/* --- Analytics API --- */

function scopeParams(league_id?: string, season_id?: string): string {
  const p = new URLSearchParams();
  if (season_id) p.set("season_id", season_id);
  else if (league_id) p.set("league_id", league_id);
  const s = p.toString();
  return s ? `?${s}` : "";
}

export const analyticsApi = {
  getPlayerStats: (playerId: string, league_id?: string, season_id?: string) =>
    request<PlayerAnalytics>(`/analytics/players/${playerId}${scopeParams(league_id, season_id)}`),
  getLeaderboard: (league_id?: string, season_id?: string) =>
    request<LeaderboardEntry[]>(`/analytics/leaderboard${scopeParams(league_id, season_id)}`),
  getPlayerShots: (playerId: string, league_id?: string, season_id?: string) =>
    request<ShotAnalytics>(`/analytics/players/${playerId}/shots${scopeParams(league_id, season_id)}`),
  getPlayerErrors: (playerId: string, league_id?: string, season_id?: string) =>
    request<ErrorProneShotAnalytics>(`/analytics/players/${playerId}/errors${scopeParams(league_id, season_id)}`),
  getPlayerShapley: (playerId: string, league_id?: string, season_id?: string) =>
    request<ShapleyAnalytics>(`/analytics/players/${playerId}/shapley${scopeParams(league_id, season_id)}`),
};

/* --- Health API --- */

export const healthApi = {
  check: () => request<{ status: string; version: string }>("/health"),
};
