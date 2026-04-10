import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApi } from "../hooks/useApi";
import { leagueApi, playerApi } from "../api/client";
import "./LeaguesPage.css";

export default function LeaguesPage() {
  const navigate = useNavigate();
  const { data: leagues, loading, refetch } = useApi(() => leagueApi.list());
  const { data: players } = useApi(() => playerApi.list());

  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const lg = await leagueApi.create({
        name: name.trim(),
        description: desc.trim() || undefined,
        player_ids: selectedPlayers.length > 0 ? selectedPlayers : undefined,
      });
      setCreating(false);
      setName("");
      setDesc("");
      setSelectedPlayers([]);
      refetch();
      navigate(`/leagues/${lg.id}`);
    } catch {
      // handled
    } finally {
      setSaving(false);
    }
  };

  const togglePlayer = (id: string) => {
    setSelectedPlayers((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  return (
    <div className="leagues-page animate-fade-in">
      <div className="leagues-header">
        <h2 className="leagues-title">Leagues</h2>
        {!creating && (
          <button className="btn btn-primary" onClick={() => setCreating(true)}>
            + New League
          </button>
        )}
      </div>

      {creating && (
        <div className="league-form card">
          <input
            className="input"
            placeholder="League name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            autoFocus
          />
          <input
            className="input"
            placeholder="Description (optional)"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            maxLength={500}
          />
          {players && players.length > 0 && (
            <div className="league-form-players">
              <span className="label">Add Players</span>
              <div className="league-player-chips">
                {players.map((p) => (
                  <button
                    key={p.id}
                    className={`player-chip ${selectedPlayers.includes(p.id) ? "selected bg-primary" : ""}`}
                    onClick={() => togglePlayer(p.id)}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div style={{ display: "flex", gap: "8px" }}>
            <button className="btn btn-success" onClick={handleCreate} disabled={saving || !name.trim()}>
              {saving ? "Creating..." : "Create League"}
            </button>
            <button className="btn btn-ghost" onClick={() => setCreating(false)}>Cancel</button>
          </div>
        </div>
      )}

      {loading && <div className="loading-state">Loading leagues...</div>}

      {!loading && leagues && leagues.length === 0 && !creating && (
        <div className="leagues-empty">
          <span style={{ fontSize: "48px" }}>🏟️</span>
          <p className="leagues-empty-title">No leagues yet</p>
          <p className="leagues-empty-sub">Create a league to organize seasons and track standings.</p>
        </div>
      )}

      {leagues && leagues.length > 0 && (
        <div className="leagues-list">
          {leagues.map((lg) => (
            <button
              key={lg.id}
              className="league-card card"
              onClick={() => navigate(`/leagues/${lg.id}`)}
            >
              <div className="league-card-header">
                <span className="league-card-name">{lg.name}</span>
                {lg.active_season && (
                  <span className="league-card-badge">
                    {lg.active_season}
                  </span>
                )}
              </div>
              {lg.description && <p className="league-card-desc">{lg.description}</p>}
              <div className="league-card-meta">
                <span>{lg.player_count} players</span>
                <span>{lg.season_count} seasons</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
