import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useApi } from "../hooks/useApi";
import { playerApi, analyticsApi } from "../api/client";
import type { TournamentMedal, Gender, SkillLevel, ErrorProneShot, PartnershipSynergy } from "../api/client";
import ShotStatsSection from "../components/ShotStatsSection";
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
  const { data: shotData } = useApi(
    () => analyticsApi.getPlayerShots(id!),
    [id]
  );
  const { data: errorData } = useApi(
    () => analyticsApi.getPlayerErrors(id!),
    [id]
  );
  const { data: leaderboard } = useApi(
    () => analyticsApi.getLeaderboard(),
    [id]
  );
  const { data: shapleyData } = useApi(
    () => analyticsApi.getPlayerShapley(id!),
    [id]
  );
  const playerElo = leaderboard?.find((e) => e.player_id === id);

  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAge, setNewAge] = useState("");
  const [newGender, setNewGender] = useState<Gender | "">("");
  const [newSkill, setNewSkill] = useState<SkillLevel | "">("");
  const [saving, setSaving] = useState(false);

  const SKILL_LABELS: Record<SkillLevel, string> = {
    beginner: "Beginner", intermediate: "Intermediate",
    advanced: "Advanced", competitive: "Competitive",
  };
  const GENDER_LABELS: Record<Gender, string> = {
    male: "Male", female: "Female",
    non_binary: "Non-binary", prefer_not_to_say: "Prefer not to say",
  };

  const handleEdit = () => {
    if (player) {
      setNewName(player.name);
      setNewAge(player.age?.toString() ?? "");
      setNewGender(player.gender ?? "");
      setNewSkill(player.skill_level ?? "");
      setEditing(true);
    }
  };

  const handleSave = async () => {
    if (!id || newName.trim().length < 2) return;
    setSaving(true);
    try {
      await playerApi.update(id, {
        name: newName.trim(),
        ...(newAge ? { age: parseInt(newAge) } : {}),
        ...(newGender ? { gender: newGender } : {}),
        ...(newSkill ? { skill_level: newSkill } : {}),
      });
      setEditing(false);
      refetch();
    } catch {
      // silently handled — refetch will show current state
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

        <h2 className="profile-name">{player.name}</h2>
      </div>

      {/* Profile fields — view or edit */}
      {editing ? (
        <div className="profile-edit-section card">
          <div className="form-row" style={{ marginBottom: "12px" }}>
            <div style={{ flex: 1 }}>
              <label className="label">Name</label>
              <input className="input" value={newName} placeholder="e.g. Rahul Sharma" onChange={e => setNewName(e.target.value)} minLength={2} maxLength={50} disabled={saving} autoFocus />
            </div>
            <div style={{ flex: 1 }}>
              <label className="label">Age</label>
              <input className="input" type="number" value={newAge} onChange={e => setNewAge(e.target.value)} min={5} max={100} placeholder="e.g. 24" disabled={saving} />
            </div>
          </div>
          <div style={{ marginBottom: "12px" }}>
            <label className="label">Gender</label>
            <select className="input" value={newGender} onChange={e => setNewGender(e.target.value as Gender | "")} disabled={saving}>
              <option value="">Not specified</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="non_binary">Non-binary</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </div>
          <div style={{ marginBottom: "12px" }}>
            <label className="label">Skill Level</label>
            <div className="skill-chips-inline">
              {(["beginner", "intermediate", "advanced", "competitive"] as SkillLevel[]).map(s => (
                <button key={s} type="button"
                  className={`skill-chip-sm ${newSkill === s ? "skill-chip-sm--active" : ""}`}
                  onClick={() => setNewSkill(newSkill === s ? "" : s)} disabled={saving}>
                  {SKILL_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving || newName.trim().length < 2}>{saving ? "..." : "Save"}</button>
            <button className="btn btn-ghost" onClick={() => setEditing(false)} disabled={saving}>Cancel</button>
          </div>
        </div>
      ) : (
        <div className="profile-meta-row">
          {player.age && <span className="meta-badge">{player.age} yrs</span>}
          {player.gender && <span className="meta-badge">{GENDER_LABELS[player.gender]}</span>}
          {player.skill_level && <span className="meta-badge meta-badge--skill">{SKILL_LABELS[player.skill_level]}</span>}
          <button className="edit-btn" onClick={handleEdit} aria-label="Edit profile">✏️</button>
        </div>
      )}

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
        <div className="detail-card card">
          <span className="detail-label">Elo Rating</span>
          <span className={`detail-value ${playerElo && playerElo.elo_rating >= 1600 ? "detail-value--wins" : playerElo && playerElo.elo_rating < 1450 ? "detail-value--losses" : ""}`}>
            {playerElo ? playerElo.elo_rating : "—"}
          </span>
        </div>
        <div className="detail-card card">
          <span className="detail-label">Impact</span>
          <span className={`detail-value ${shapleyData && shapleyData.shapley_value > 0.02 ? "detail-value--wins" : shapleyData && shapleyData.shapley_value < -0.02 ? "detail-value--losses" : ""}`}>
            {shapleyData ? `${shapleyData.shapley_value > 0 ? "+" : ""}${Math.round(shapleyData.shapley_value * 100)}%` : "—"}
          </span>
        </div>
      </div>

      {/* Shot Analytics Section */}
      {shotData && <ShotStatsSection data={shotData} />}

      {/* Error-Prone Shots Section */}
      {errorData && errorData.shots.length > 0 && (
        <div className="error-shots-section">
          <h3 className="error-shots-title">Error-Prone Shots</h3>
          <p className="error-shots-subtitle">Shots that most often lead to errors against this player</p>
          <div className="error-shots-list">
            {errorData.shots.map((s: ErrorProneShot) => {
              const pct = Math.round(s.error_rate * 100);
              return (
                <div key={s.shot_type} className="error-shot-row">
                  <span className="error-shot-label">{s.label}</span>
                  <div className="error-shot-bar-wrap">
                    <div
                      className="error-shot-bar-fill"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="error-shot-count">{s.error_count}</span>
                  <span className="error-shot-rate">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Shapley Breakdown & Partnership Synergy */}
      {shapleyData && (shapleyData.doubles_matches > 0 || shapleyData.singles_matches > 0) && (
        <div className="shapley-section">
          <h3 className="shapley-title">Player Impact Breakdown</h3>
          <div className="shapley-cards">
            {shapleyData.singles_contribution != null && (
              <div className="shapley-card card">
                <span className="shapley-card-label">Singles</span>
                <span className={`shapley-card-value ${shapleyData.singles_contribution > 0.02 ? "detail-value--wins" : shapleyData.singles_contribution < -0.02 ? "detail-value--losses" : ""}`}>
                  {shapleyData.singles_contribution > 0 ? "+" : ""}{Math.round(shapleyData.singles_contribution * 100)}%
                </span>
                <span className="shapley-card-sub">{shapleyData.singles_matches} matches</span>
              </div>
            )}
            {shapleyData.doubles_shapley != null && (
              <div className="shapley-card card">
                <span className="shapley-card-label">Doubles</span>
                <span className={`shapley-card-value ${shapleyData.doubles_shapley > 0.02 ? "detail-value--wins" : shapleyData.doubles_shapley < -0.02 ? "detail-value--losses" : ""}`}>
                  {shapleyData.doubles_shapley > 0 ? "+" : ""}{Math.round(shapleyData.doubles_shapley * 100)}%
                </span>
                <span className="shapley-card-sub">{shapleyData.doubles_matches} matches, {shapleyData.partnerships_analyzed} partners</span>
              </div>
            )}
          </div>

          {shapleyData.partnerships.length > 0 && (
            <>
              <h4 className="synergy-title">Partnership Synergy</h4>
              <div className="synergy-list">
                {shapleyData.partnerships.map((p: PartnershipSynergy) => {
                  const synergyPct = Math.round(p.synergy * 100);
                  const synergyClass = p.synergy > 0.02 ? "synergy--pos" : p.synergy < -0.02 ? "synergy--neg" : "synergy--neutral";
                  return (
                    <div key={p.partner_id} className="synergy-row">
                      <span className="synergy-partner">{p.partner_name}</span>
                      <span className="synergy-record">{p.wins_together}W / {p.matches_together - p.wins_together}L</span>
                      <span className="synergy-wr">{Math.round(p.pair_win_rate * 100)}%</span>
                      <span className={`synergy-value ${synergyClass}`}>
                        {synergyPct > 0 ? "+" : ""}{synergyPct}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

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
