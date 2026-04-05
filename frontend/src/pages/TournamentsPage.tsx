import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApi } from "../hooks/useApi";
import { tournamentApi } from "../api/client";
import "./TournamentsPage.css";

export default function TournamentsPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<string>("all");
  const { data: tournaments, loading, error } = useApi(() => tournamentApi.list());

  if (loading) return <div className="loading-state">Loading tournaments...</div>;
  if (error) return <div className="error-state">Error: {error}</div>;

  const filtered = tournaments?.filter(t => filter === "all" || t.status === filter) || [];

  return (
    <div className="tournaments-page animate-fade-in">
      <div className="page-header">
        <h2 className="page-title">Tournaments</h2>
        <button 
          className="btn btn-primary btn-sm"
          onClick={() => navigate("/tournaments/new")}
        >
          + New
        </button>
      </div>

      <div className="filter-chips">
        {["all", "upcoming", "active", "completed"].map(f => (
          <button 
            key={f}
            className={`filter-chip ${filter === f ? "active bg-primary hover-scale" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="tournaments-list">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <p>No tournaments found.</p>
          </div>
        ) : (
          filtered.map((t) => (
            <div 
              key={t.id} 
              className="card tournament-card animate-slide-up"
              onClick={() => navigate(`/tournaments/${t.id}`)}
              style={{ cursor: "pointer" }}
            >
              <div className="card-header">
                <h3>{t.name}</h3>
                <span className={`status-badge status-${t.status}`}>{t.status}</span>
              </div>
              {t.description && <p className="tournament-desc">{t.description}</p>}
              <div className="card-footer">
                <span className="timestamp">Started: {new Date(t.created_at).toLocaleDateString()}</span>
                <span className="arrow">→</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
