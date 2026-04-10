import { useNavigate } from "react-router-dom";
import { useApi } from "../hooks/useApi";
import { playerApi, matchApi, tournamentApi, analyticsApi } from "../api/client";
import type { MatchData } from "../api/client";
import "./HomePage.css";

function firstNames(match: MatchData, side: "a" | "b") {
  const team = side === "a" ? match.team_a : match.team_b;
  // List endpoint returns player_names (strings); detail endpoint returns players (objects)
  const names = team.players?.length
    ? team.players.map((p) => p.name)
    : (team.player_names ?? []);
  return names.map((n) => n.split(" ")[0]).join(" & ");
}

const QUICK_ACTIONS = [
  { icon: "🏸", label: "New Match",   to: "/matches/new",  color: "#58CC02", shadow: "#46A302" },
  { icon: "👥", label: "Players",     to: "/players",      color: "#1CB0F6", shadow: "#1292CC" },
  { icon: "🏟️", label: "Leagues",     to: "/leagues",      color: "#FFC800", shadow: "#CCA000" },
  { icon: "📊", label: "Analytics",   to: "/analytics",    color: "#FF9600", shadow: "#CC7A00" },
];

export default function HomePage() {
  const navigate = useNavigate();

  const { data: players,     loading: playersLoading }  = useApi(() => playerApi.list(), []);
  const { data: matches,     loading: matchesLoading }  = useApi(() => matchApi.list(), []);
  const { data: tournaments } = useApi(() => tournamentApi.list(), []);
  const { data: leaderboard } = useApi(() => analyticsApi.getLeaderboard(), []);

  const liveMatches   = matches?.filter((m) => m.status === "in_progress") ?? [];
  const recentMatches = matches?.filter((m) => m.status === "completed").slice(-4).reverse() ?? [];
  const topPlayers    = leaderboard?.slice(0, 3) ?? [];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="home-page animate-fade-in">

      {/* ── Hero ── */}
      <div className="hp-hero">
        <div className="hp-hero-bg" />
        <div className="hp-hero-inner">
          <div className="hp-hero-left">
            <p className="hp-greeting">{greeting} 👋</p>
            <h2 className="hp-tagline">Let's play<br />badminton!</h2>
          </div>
          <div className="hp-hero-right">
            <div className="hp-stat-pill">
              <span className="hp-stat-num">{players?.length ?? "—"}</span>
              <span className="hp-stat-lbl">Players</span>
            </div>
            <div className="hp-stat-pill">
              <span className="hp-stat-num">{matches?.length ?? "—"}</span>
              <span className="hp-stat-lbl">Matches</span>
            </div>
            <div className="hp-stat-pill">
              <span className="hp-stat-num">{tournaments?.length ?? "—"}</span>
              <span className="hp-stat-lbl">Events</span>
            </div>
          </div>
        </div>

        {/* Live indicator strip */}
        {liveMatches.length > 0 && (
          <div className="hp-live-strip" onClick={() => navigate(`/matches/${liveMatches[0].id}`)}>
            <span className="hp-live-dot" />
            <span className="hp-live-text">
              {liveMatches.length} match{liveMatches.length > 1 ? "es" : ""} in progress
            </span>
            <span className="hp-live-arrow">→</span>
          </div>
        )}
      </div>

      {/* ── Quick actions ── */}
      <div className="hp-quick-row">
        {QUICK_ACTIONS.map((a) => (
          <button
            key={a.to}
            className="hp-quick-btn"
            style={{ "--qa-color": a.color, "--qa-shadow": a.shadow } as React.CSSProperties}
            onClick={() => navigate(a.to)}
          >
            <span className="hp-quick-icon">{a.icon}</span>
            <span className="hp-quick-label">{a.label}</span>
          </button>
        ))}
      </div>

      {/* ── Live / ongoing matches ── */}
      {liveMatches.length > 0 && (
        <section className="hp-section">
          <div className="hp-section-header">
            <h3 className="hp-section-title">Ongoing</h3>
            <button className="hp-see-all" onClick={() => navigate("/matches")}>View all →</button>
          </div>
          <div className="hp-scroll-row">
            {liveMatches.map((m) => {
              const sA = m.current_score?.a ?? m.current_game?.score_a ?? 0;
              const sB = m.current_score?.b ?? m.current_game?.score_b ?? 0;
              return (
                <button
                  key={m.id}
                  className="hp-match-card hp-match-card--live"
                  onClick={() => navigate(`/matches/${m.id}`)}
                >
                  <div className="hp-mc-badge hp-mc-badge--live">● LIVE</div>
                  <div className="hp-mc-teams">
                    <div className="hp-mc-team">
                      <span className="hp-mc-name a">{firstNames(m, "a")}</span>
                      <span className="hp-mc-score a">{sA}</span>
                    </div>
                    <span className="hp-mc-vs">vs</span>
                    <div className="hp-mc-team hp-mc-team--right">
                      <span className="hp-mc-score b">{sB}</span>
                      <span className="hp-mc-name b">{firstNames(m, "b")}</span>
                    </div>
                  </div>
                  <div className="hp-mc-footer">
                    <span>{m.match_type} · {m.match_format?.toUpperCase()}</span>
                    <span className="hp-mc-resume">Resume →</span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Recent matches ── */}
      {recentMatches.length > 0 && (
        <section className="hp-section">
          <div className="hp-section-header">
            <h3 className="hp-section-title">Recent Matches</h3>
            <button className="hp-see-all" onClick={() => navigate("/matches")}>View all →</button>
          </div>
          <div className="hp-recent-list">
            {recentMatches.map((m) => {
              const won = m.winner_side;
              const gamesA = m.team_a.games_won;
              const gamesB = m.team_b.games_won;
              return (
                <button
                  key={m.id}
                  className="hp-recent-row"
                  onClick={() => navigate(`/matches/${m.id}`)}
                >
                  <div className="hp-rr-teams">
                    <span className={`hp-rr-name ${won === "a" ? "hp-rr-winner" : ""}`}>
                      {firstNames(m, "a")}
                    </span>
                    <div className="hp-rr-score">
                      <span className={won === "a" ? "hp-rr-s win" : "hp-rr-s"}>{gamesA}</span>
                      <span className="hp-rr-sep">–</span>
                      <span className={won === "b" ? "hp-rr-s win" : "hp-rr-s"}>{gamesB}</span>
                    </div>
                    <span className={`hp-rr-name hp-rr-name--right ${won === "b" ? "hp-rr-winner" : ""}`}>
                      {firstNames(m, "b")}
                    </span>
                  </div>
                  <span className="hp-rr-type">{m.match_type}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Leaderboard ── */}
      {topPlayers.length > 0 && (
        <section className="hp-section">
          <div className="hp-section-header">
            <h3 className="hp-section-title">Leaderboard</h3>
            <button className="hp-see-all" onClick={() => navigate("/analytics")}>View all →</button>
          </div>
          <div className="hp-lb-list">
            {topPlayers.map((p) => (
              <div key={p.player_id} className="hp-lb-row">
                <span className={`hp-lb-rank ${p.rank <= 3 ? `hp-lb-rank--${p.rank}` : ""}`}>
                  {p.rank === 1 ? "🥇" : p.rank === 2 ? "🥈" : p.rank === 3 ? "🥉" : `#${p.rank}`}
                </span>
                <span className="hp-lb-name">{p.player_name}</span>
                <div className="hp-lb-bar-wrap">
                  <div
                    className="hp-lb-bar-fill"
                    style={{ width: `${Math.round(p.win_rate * 100)}%` }}
                  />
                </div>
                <span className="hp-lb-pct">{Math.round(p.win_rate * 100)}%</span>
                <span className="hp-lb-record">{p.wins}W</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Empty state ── */}
      {!playersLoading && !matchesLoading && !matches?.length && !players?.length && (
        <div className="hp-empty">
          <span className="hp-empty-icon">🏸</span>
          <p className="hp-empty-title">Nothing here yet</p>
          <p className="hp-empty-sub">Add players and start your first match to get going.</p>
        </div>
      )}

    </div>
  );
}
