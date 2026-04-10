import { useParams, useNavigate } from "react-router-dom";
import { useApi } from "../hooks/useApi";
import { seasonApi, analyticsApi } from "../api/client";
import type { LeaderboardEntry } from "../api/client";
import "./SeasonDetailPage.css";

const STATUS_LABELS: Record<string, string> = {
  upcoming: "Upcoming", active: "Active", completed: "Completed",
};

export default function SeasonDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: season, loading } = useApi(() => seasonApi.get(id!), [id]);
  const { data: standings } = useApi(
    () => analyticsApi.getLeaderboard(undefined, id),
    [id]
  );

  if (loading || !season) return <div className="loading-state">Loading...</div>;

  // Filter standings to players who actually played in this season
  const activePlayers = standings?.filter((e) => e.matches_played > 0) ?? [];

  return (
    <div className="season-detail-page animate-fade-in">
      <button className="back-btn" onClick={() => navigate(`/leagues/${season.league_id}`)}>
        ← {season.league_name}
      </button>

      <div className="sd-header">
        <div className="sd-header-top">
          <h2 className="sd-title">{season.name}</h2>
          <span className={`sd-status sd-status--${season.status}`}>{STATUS_LABELS[season.status]}</span>
        </div>
        <p className="sd-dates">{season.start_date} → {season.end_date}</p>
        <p className="sd-match-count">{season.match_count} matches played</p>
      </div>

      <section className="sd-section">
        <h3 className="sd-section-title">Season Standings</h3>
        {activePlayers.length === 0 ? (
          <p className="sd-empty">No completed matches in this season yet.</p>
        ) : (
          <div className="sd-standings">
            <div className="sd-standings-header">
              <span>#</span>
              <span>Player</span>
              <span>W/L</span>
              <span>Elo</span>
              <span>Impact</span>
            </div>
            {activePlayers.map((e: LeaderboardEntry) => {
              const sv = e.shapley_value;
              const svPct = sv != null ? Math.round(sv * 100) : null;
              return (
                <button
                  key={e.player_id}
                  className="sd-standings-row card"
                  onClick={() => navigate(`/players/${e.player_id}`)}
                >
                  <span className="sd-rank">
                    {e.rank === 1 ? "🥇" : e.rank === 2 ? "🥈" : e.rank === 3 ? "🥉" : `#${e.rank}`}
                  </span>
                  <span className="sd-name">{e.player_name}</span>
                  <span className="sd-wl">
                    <span className="sd-w">{e.wins}W</span>
                    <span className="sd-sep">/</span>
                    <span className="sd-l">{e.losses}L</span>
                  </span>
                  <span className="sd-elo">{e.elo_rating}</span>
                  <span className={`sd-impact ${svPct != null && svPct > 0 ? "sd-impact--pos" : svPct != null && svPct < 0 ? "sd-impact--neg" : ""}`}>
                    {svPct != null ? `${svPct > 0 ? "+" : ""}${svPct}%` : "—"}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
