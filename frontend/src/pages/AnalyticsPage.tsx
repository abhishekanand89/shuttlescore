import { useNavigate } from "react-router-dom";
import { useApi } from "../hooks/useApi";
import { analyticsApi } from "../api/client";
import type { LeaderboardEntry } from "../api/client";
import "./AnalyticsPage.css";

function WinRateBar({ rate }: { rate: number }) {
  return (
    <div className="winrate-bar" aria-label={`Win rate ${Math.round(rate * 100)}%`}>
      <div className="winrate-fill" style={{ width: `${rate * 100}%` }} />
    </div>
  );
}

function LeaderboardRow({
  entry,
  onClick,
}: {
  entry: LeaderboardEntry;
  onClick: () => void;
}) {
  const rankLabel =
    entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : `#${entry.rank}`;

  const eloColor = entry.elo_rating >= 1600 ? "lb-elo--high"
    : entry.elo_rating >= 1450 ? "lb-elo--mid" : "lb-elo--low";

  const sv = entry.shapley_value;
  const svPct = sv != null ? Math.round(sv * 100) : null;
  const svClass = sv == null ? "" : sv > 0.02 ? "lb-impact--pos" : sv < -0.02 ? "lb-impact--neg" : "lb-impact--neutral";

  return (
    <button className="lb-row card" onClick={onClick} aria-label={`View ${entry.player_name} analytics`}>
      <span className="lb-rank">{rankLabel}</span>
      <span className="lb-name">{entry.player_name}</span>
      <span className="lb-record">
        <span className="lb-wins">{entry.wins}W</span>
        <span className="lb-sep"> / </span>
        <span className="lb-losses">{entry.losses}L</span>
      </span>
      <span className={`lb-elo ${eloColor}`}>{entry.elo_rating}</span>
      <span className={`lb-impact ${svClass}`}>
        {svPct != null ? `${svPct > 0 ? "+" : ""}${svPct}%` : "—"}
      </span>
      <div className="lb-winrate-col">
        <span className="lb-winrate-pct">{Math.round(entry.win_rate * 100)}%</span>
        <WinRateBar rate={entry.win_rate} />
      </div>
    </button>
  );
}

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const { data: leaderboard, loading, error } = useApi(() => analyticsApi.getLeaderboard());

  return (
    <div className="analytics-page animate-fade-in">
      <div className="analytics-header">
        <h2 className="analytics-title">Leaderboard</h2>
        <p className="analytics-subtitle">Ranked by wins across completed matches</p>
      </div>

      {loading && (
        <div className="lb-skeleton">
          {[1, 2, 3].map((i) => (
            <div key={i} className="lb-skeleton-row">
              <div className="skeleton-line skeleton-narrow" />
              <div className="skeleton-line skeleton-wide" />
              <div className="skeleton-line skeleton-narrow" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="analytics-error">
          <p>⚠️ {error}</p>
        </div>
      )}

      {!loading && !error && leaderboard && leaderboard.length === 0 && (
        <div className="analytics-empty">
          <p className="empty-icon">📊</p>
          <p className="empty-text">No completed matches yet.</p>
          <p className="empty-sub">Play some matches to see rankings here.</p>
        </div>
      )}

      {!loading && !error && leaderboard && leaderboard.length > 0 && (
        <div className="lb-list">
          <div className="lb-header-row">
            <span>Rank</span>
            <span>Player</span>
            <span>W / L</span>
            <span>Elo</span>
            <span>Impact</span>
            <span>Win Rate</span>
          </div>
          {leaderboard.map((entry) => (
            <LeaderboardRow
              key={entry.player_id}
              entry={entry}
              onClick={() => navigate(`/players/${entry.player_id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
