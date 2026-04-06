import type { ShotAnalytics } from "../api/client";
import "./ShotStatsSection.css";

function StatBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="stat-bar-track">
      <div className="stat-bar-fill" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

interface Props {
  data: ShotAnalytics;
}

export default function ShotStatsSection({ data }: Props) {
  if (data.total_detailed_points === 0) {
    return (
      <div className="shot-section">
        <h3 className="shot-section-title">Shot Analytics</h3>
        <div className="shot-empty">
          <p className="shot-empty-icon">🏸</p>
          <p className="shot-empty-text">No detailed match data yet</p>
          <p className="shot-empty-sub">Play matches in Detailed tracking mode to see shot stats here.</p>
        </div>
      </div>
    );
  }

  const maxShotCount = data.shots.length > 0 ? data.shots[0].count : 1;
  const maxReasonCount = data.end_reasons.length > 0 ? data.end_reasons[0].count : 1;

  return (
    <div className="shot-section">
      <h3 className="shot-section-title">Shot Analytics</h3>

      {/* Summary cards */}
      <div className="shot-summary-grid">
        <div className="shot-summary-card card">
          <span className="shot-summary-label">Avg Rally</span>
          <span className="shot-summary-value">
            {data.avg_rally_duration_seconds != null
              ? `${data.avg_rally_duration_seconds}s`
              : "—"}
          </span>
        </div>
        <div className="shot-summary-card card">
          <span className="shot-summary-label">Serve Errors</span>
          <span className="shot-summary-value">
            {data.serve_error_rate != null
              ? `${Math.round(data.serve_error_rate * 100)}%`
              : "—"}
          </span>
        </div>
        <div className="shot-summary-card card">
          <span className="shot-summary-label">Detailed Pts</span>
          <span className="shot-summary-value">{data.total_detailed_points}</span>
        </div>
      </div>

      {/* Winning shots breakdown */}
      {data.shots.length > 0 && (
        <div className="shot-breakdown">
          <h4 className="shot-breakdown-title">Winning Shots</h4>
          <div className="shot-rows">
            {data.shots.map((s) => (
              <div key={s.shot_type} className="shot-row">
                <span className="shot-row-label">{s.label}</span>
                <div className="shot-row-bar-col">
                  <StatBar value={s.count} max={maxShotCount} color="var(--color-primary)" />
                </div>
                <span className="shot-row-count">{s.count}</span>
                <span className="shot-row-rate">{Math.round(s.win_rate * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* End reason breakdown */}
      {data.end_reasons.length > 0 && (
        <div className="shot-breakdown">
          <h4 className="shot-breakdown-title">How Points Ended</h4>
          <div className="shot-rows">
            {data.end_reasons.map((r) => {
              const isPositive = r.reason === "winner";
              const isError = r.reason.includes("error") || r.reason === "line_out";
              const color = isPositive
                ? "#4caf50"
                : isError
                ? "var(--color-accent, #ff6b35)"
                : "var(--color-primary-light, #6ca9f0)";
              return (
                <div key={r.reason} className="shot-row">
                  <span className="shot-row-label">{r.label}</span>
                  <div className="shot-row-bar-col">
                    <StatBar value={r.count} max={maxReasonCount} color={color} />
                  </div>
                  <span className="shot-row-count">{r.count}</span>
                  <span className="shot-row-rate">{r.percentage}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
