import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useApi } from "../hooks/useApi";
import { playerApi, analyticsApi } from "../api/client";
import type { TournamentMedal } from "../api/client";
import "./PlayerDetailPage.css";

const MEDAL_ICONS: Record<string, string> = {
  gold: "🥇",
  silver: "🥈",
  bronze: "🥉",
};

export default function PlayerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: player, loading, error, refetch } = useApi(
    () => playerApi.get(id!),
    [id]
  );
  const { data: analytics, loading: statsLoading } = useApi(
    () => analyticsApi.getPlayerStats(id!),
    [id]
  );

  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);

  const handleEdit = () => {
    if (player) {
      setNewName(player.name);
      setEditing(true);
    }
  };

  const handleSave = async () => {
    if (!id || newName.trim().length < 2) return;
    setSaving(true);
    try {
      await playerApi.update(id, { name: newName.trim() });
      setEditing(false);
      refetch();
    } catch {
      // Error handled by refetch
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="detail-page animate-fade-in">
        <div className="detail-skeleton">
          <div className="skeleton-avatar" />
          <div className="skeleton-line skeleton-wide" />
          <div className="skeleton-line skeleton-narrow" />
        </div>
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="detail-page animate-fade-in">
        <div className="detail-error">
          <p>⚠️ {error || "Player not found"}</p>
          <button className="btn btn-ghost" onClick={() => navigate("/players")}>
            Back to Players
          </button>
        </div>
      </div>
    );
  }

  const initials = player.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const joinDate = new Date(player.created_at).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const winRatePct = analytics
    ? `${Math.round(analytics.matches.win_rate * 100)}%`
    : "—";

  return (
    <div className="detail-page animate-fade-in">
      <button
        className="back-btn"
        onClick={() => navigate("/players")}
        id="back-to-players"
        aria-label="Back to players"
      >
        ← Players
      </button>

      <div className="profile-header">
        <div className="profile-avatar">{initials}</div>

        {editing ? (
          <div className="edit-name-row">
            <input
              id="edit-name-input"
              className="input edit-name-input"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus
              minLength={2}
              maxLength={50}
              disabled={saving}
            />
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving || newName.trim().length < 2}
              id="save-name"
            >
              {saving ? "..." : "Save"}
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => setEditing(false)}
              disabled={saving}
              id="cancel-edit"
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="name-row">
            <h2 className="profile-name">{player.name}</h2>
            <button
              className="edit-btn"
              onClick={handleEdit}
              id="edit-name-btn"
              aria-label="Edit name"
            >
              ✏️
            </button>
          </div>
        )}
      </div>

      <div className="detail-cards">
        <div className="detail-card card">
          <span className="detail-label">Phone</span>
          <span className="detail-value mono">{player.phone}</span>
        </div>
        <div className="detail-card card">
          <span className="detail-label">Joined</span>
          <span className="detail-value">{joinDate}</span>
        </div>
        <div className={`detail-card card${statsLoading || !analytics ? " detail-card--loading" : ""}`}>
          <span className="detail-label">Matches Played</span>
          <span className="detail-value">
            {statsLoading ? "…" : analytics ? analytics.matches.total : "—"}
          </span>
        </div>
        <div className={`detail-card card${statsLoading || !analytics ? " detail-card--loading" : ""}`}>
          <span className="detail-label">Win Rate</span>
          <span className="detail-value">
            {statsLoading ? "…" : analytics ? winRatePct : "—"}
          </span>
        </div>
        <div className={`detail-card card${statsLoading || !analytics ? " detail-card--loading" : ""}`}>
          <span className="detail-label">Wins</span>
          <span className="detail-value detail-value--wins">
            {statsLoading ? "…" : analytics ? analytics.matches.wins : "—"}
          </span>
        </div>
        <div className={`detail-card card${statsLoading || !analytics ? " detail-card--loading" : ""}`}>
          <span className="detail-label">Losses</span>
          <span className="detail-value detail-value--losses">
            {statsLoading ? "…" : analytics ? analytics.matches.losses : "—"}
          </span>
        </div>
      </div>

      {/* Tournament Medals Section */}
      {!statsLoading && analytics && analytics.tournaments.participated > 0 && (
        <div className="medals-section">
          <h3 className="medals-title">Tournament Medals</h3>
          <div className="medals-list">
            {analytics.tournaments.medals.map((medal: TournamentMedal) => (
              <div key={medal.tournament_id} className="medal-card card">
                <span className="medal-icon">{MEDAL_ICONS[medal.medal]}</span>
                <div className="medal-info">
                  <span className="medal-tournament">{medal.tournament_name}</span>
                  <span className="medal-record">
                    {medal.wins}W / {medal.losses}L
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
