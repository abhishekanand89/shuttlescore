import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useApi } from "../hooks/useApi";
import { leagueApi, playerApi, seasonApi } from "../api/client";
import type { SeasonSummary } from "../api/client";
import "./LeagueDetailPage.css";

const STATUS_COLORS: Record<string, string> = {
  upcoming: "season-status--upcoming",
  active: "season-status--active",
  completed: "season-status--completed",
};

export default function LeagueDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: league, loading, refetch } = useApi(() => leagueApi.get(id!), [id]);
  const { data: allPlayers } = useApi(() => playerApi.list());

  const [addingPlayers, setAddingPlayers] = useState(false);
  const [creatingSeason, setCreatingSeason] = useState(false);
  const [seasonName, setSeasonName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [saving, setSaving] = useState(false);

  const handleAddPlayer = async (playerId: string) => {
    await leagueApi.addPlayers(id!, [playerId]);
    refetch();
  };

  const handleRemovePlayer = async (playerId: string) => {
    await leagueApi.removePlayer(id!, playerId);
    refetch();
  };

  const handleCreateSeason = async () => {
    if (!seasonName.trim() || !startDate || !endDate) return;
    setSaving(true);
    try {
      const s = await leagueApi.createSeason(id!, {
        name: seasonName.trim(),
        start_date: startDate,
        end_date: endDate,
      });
      setCreatingSeason(false);
      setSeasonName("");
      setStartDate("");
      setEndDate("");
      refetch();
      navigate(`/seasons/${s.id}`);
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (seasonId: string, status: string) => {
    await seasonApi.updateStatus(seasonId, status);
    refetch();
  };

  if (loading || !league) return <div className="loading-state">Loading...</div>;

  const rosterIds = new Set(league.players.map((p) => p.id));
  const availablePlayers = allPlayers?.filter((p) => !rosterIds.has(p.id)) ?? [];

  return (
    <div className="league-detail-page animate-fade-in">
      <button className="back-btn" onClick={() => navigate("/leagues")}>
        ← Leagues
      </button>

      <div className="ld-header">
        <h2 className="ld-title">{league.name}</h2>
        {league.description && <p className="ld-desc">{league.description}</p>}
      </div>

      {/* Roster */}
      <section className="ld-section">
        <div className="ld-section-header">
          <h3 className="ld-section-title">Players ({league.players.length})</h3>
          <button className="btn btn-ghost" onClick={() => setAddingPlayers(!addingPlayers)}>
            {addingPlayers ? "Done" : "+ Add"}
          </button>
        </div>
        <div className="ld-player-list">
          {league.players.map((p) => (
            <div key={p.id} className="ld-player-row">
              <span className="ld-player-name">{p.name}</span>
              <button className="ld-remove-btn" onClick={() => handleRemovePlayer(p.id)}>×</button>
            </div>
          ))}
        </div>
        {addingPlayers && availablePlayers.length > 0 && (
          <div className="ld-add-players">
            {availablePlayers.map((p) => (
              <button key={p.id} className="player-chip" onClick={() => handleAddPlayer(p.id)}>
                + {p.name}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Seasons */}
      <section className="ld-section">
        <div className="ld-section-header">
          <h3 className="ld-section-title">Seasons</h3>
          {!creatingSeason && (
            <button className="btn btn-ghost" onClick={() => setCreatingSeason(true)}>
              + New Season
            </button>
          )}
        </div>

        {creatingSeason && (
          <div className="ld-season-form card">
            <input className="input" placeholder="Season name" value={seasonName}
              onChange={(e) => setSeasonName(e.target.value)} maxLength={100} autoFocus />
            <div style={{ display: "flex", gap: "8px" }}>
              <input className="input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              <input className="input" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button className="btn btn-success" onClick={handleCreateSeason}
                disabled={saving || !seasonName.trim() || !startDate || !endDate}>
                {saving ? "..." : "Create"}
              </button>
              <button className="btn btn-ghost" onClick={() => setCreatingSeason(false)}>Cancel</button>
            </div>
          </div>
        )}

        {league.seasons.length === 0 && !creatingSeason && (
          <p className="ld-empty-text">No seasons yet. Create one to start tracking standings.</p>
        )}

        <div className="ld-seasons-list">
          {league.seasons.map((s: SeasonSummary) => (
            <button
              key={s.id}
              className="ld-season-card card"
              onClick={() => navigate(`/seasons/${s.id}`)}
            >
              <div className="ld-season-top">
                <span className="ld-season-name">{s.name}</span>
                <span className={`ld-season-status ${STATUS_COLORS[s.status]}`}>{s.status}</span>
              </div>
              <div className="ld-season-meta">
                <span>{s.start_date} → {s.end_date}</span>
                <span>{s.match_count} matches</span>
              </div>
              {s.status === "upcoming" && (
                <button className="btn btn-ghost ld-action-btn" onClick={(e) => { e.stopPropagation(); handleStatusChange(s.id, "active"); }}>
                  Activate
                </button>
              )}
              {s.status === "active" && (
                <button className="btn btn-ghost ld-action-btn" onClick={(e) => { e.stopPropagation(); handleStatusChange(s.id, "completed"); }}>
                  Complete
                </button>
              )}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
