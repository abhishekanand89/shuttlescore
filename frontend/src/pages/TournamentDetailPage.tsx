import { useParams, useNavigate } from "react-router-dom";
import { useApi } from "../hooks/useApi";
import { tournamentApi, matchApi } from "../api/client";

export default function TournamentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Parallel fetch: tournament metadata + list of tagged matches
  const { data: tourneyRes, loading: loadingT } = useApi(() => tournamentApi.get(id!));
  const { data: matches, loading: loadingM } = useApi(() => matchApi.list());

  if (loadingT || loadingM) return <div className="loading-state">Loading tournament...</div>;
  if (!tourneyRes) return <div className="error-state">Tournament not found</div>;

  const t = tourneyRes.tournament;
  const associatedMatches = matches?.filter(m => m.tournament_id === t.id) || [];

  return (
    <div className="tournament-detail-page animate-slide-up">
      <div className="header-row" style={{ marginBottom: "16px" }}>
        <button className="back-btn" onClick={() => navigate("/tournaments")}>← Tournaments</button>
      </div>

      <div className="card" style={{ marginBottom: "24px", borderColor: "var(--color-primary-dark)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
          <h2 style={{ fontSize: "22px", margin: 0, fontWeight: "bold" }}>{t.name}</h2>
          <span className={`status-badge status-${t.status}`}>{t.status}</span>
        </div>
        {t.description && <p style={{ color: "var(--color-text-secondary)", marginBottom: "12px" }}>{t.description}</p>}
        <div style={{ fontSize: "12px", color: "var(--color-text-tertiary)" }}>
          Registered: {new Date(t.created_at).toLocaleDateString()}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h3 style={{ fontSize: "18px", margin: 0 }}>Associated Matches ({associatedMatches.length})</h3>
        <button 
          className="btn btn-ghost btn-sm" 
          style={{ padding: "4px 8px", fontSize: "12px" }}
          onClick={() => navigate("/matches/new")}
        >
          + Add Match
        </button>
      </div>

      <div className="matches-list" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {associatedMatches.length === 0 ? (
          <div className="empty-state" style={{ padding: "32px", textAlign: "center", background: "var(--color-surface)", borderRadius: "8px" }}>
            <p>No matches recorded yet for this tournament.</p>
          </div>
        ) : (
          associatedMatches.map(m => (
            <div key={m.id} className="card match-card" onClick={() => navigate(`/matches/${m.id}`)} style={{ cursor: "pointer" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span className="status-badge">{m.status}</span>
                <span className="timestamp">{new Date(m.created_at).toLocaleDateString()}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{flex: 1}}>
                  <div style={{ color: m.winner_side === "a" ? "var(--color-primary-light)" : "var(--color-text)" }}>
                    {m.team_a.player_names?.join(" & ")} {m.winner_side === "a" && "🏆"}
                  </div>
                  <div style={{ color: m.winner_side === "b" ? "var(--color-primary-light)" : "var(--color-text)" }}>
                    {m.team_b.player_names?.join(" & ")} {m.winner_side === "b" && "🏆"}
                  </div>
                </div>
                {m.status === "in_progress" && m.current_score && (
                  <div style={{ textAlign: "right", fontWeight: "bold" }}>
                    <div>{m.current_score.a}</div>
                    <div>{m.current_score.b}</div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
