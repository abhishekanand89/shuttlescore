import { useNavigate } from "react-router-dom";
import { useApi } from "../hooks/useApi";
import { playerApi, matchApi } from "../api/client";
import "./HomePage.css";

export default function HomePage() {
  const { data: players } = useApi(() => playerApi.list(), []);
  const { data: matches } = useApi(() => matchApi.list(), []);
  const navigate = useNavigate();
  const playerCount = players?.length ?? 0;
  const matchCount = matches?.length ?? 0;

  return (
    <div className="home-page animate-fade-in">
      <section className="hero">
        <div className="hero-icon">🏸</div>
        <h2 className="hero-title">Ready to Play?</h2>
        <p className="hero-subtitle">Track your badminton matches point by point</p>
      </section>

      <section className="stats-row">
        <div className="stat-card card">
          <span className="stat-value">{playerCount}</span>
          <span className="stat-label">Players</span>
        </div>
        <div className="stat-card card">
          <span className="stat-value">{matchCount}</span>
          <span className="stat-label">Matches</span>
        </div>
        <div className="stat-card card">
          <span className="stat-value">—</span>
          <span className="stat-label">Tournaments</span>
        </div>
      </section>

      <section className="quick-actions">
        <h3 className="section-title">Quick Actions</h3>
        <div className="actions-grid">
          <button
            className="action-card card"
            onClick={() => navigate("/players")}
            id="action-manage-players"
          >
            <span className="action-icon">👥</span>
            <span className="action-label">Manage Players</span>
          </button>
          <button
            className="action-card card"
            onClick={() => navigate("/matches/new")}
            id="action-new-match"
          >
            <span className="action-icon">🏆</span>
            <span className="action-label">New Match</span>
          </button>
        </div>
      </section>
    </div>
  );
}
