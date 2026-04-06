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

  return (
    <button className="lb-row card" onClick={onClick} aria-label={`View ${entry.player_name} analytics`}>
      <span className="lb-rank">{rankLabel}</span>
      <span className="lb-name">{entry.player_name}</span>
      <span className="lb-record">
        <span className="lb-wins">{entry.wins}W</span>
        <span className="lb-sep"> / </span>
        <span className="lb-losses">{entry.losses}L</span>
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
