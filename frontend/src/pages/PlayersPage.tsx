import { useState, useCallback } from "react";
import { useApi } from "../hooks/useApi";
import { playerApi } from "../api/client";
import PlayerCard from "../components/PlayerCard";
import PlayerForm from "../components/PlayerForm";
import EmptyState from "../components/EmptyState";
import "./PlayersPage.css";

export default function PlayersPage() {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  const { data: players, loading, error, refetch } = useApi(
    () => playerApi.list(search || undefined),
    [search]
  );

  const handleCreated = useCallback(() => {
    setShowForm(false);
    refetch();
  }, [refetch]);

  return (
    <div className="players-page animate-fade-in">
      <div className="page-header">
        <h2 className="page-title">Players</h2>
        <span className="player-count">{players?.length ?? 0}</span>
      </div>

      <div className="search-bar">
        <input
          id="player-search"
          className="input search-input"
          type="search"
          placeholder="🔍  Search players..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="player-list">
        {loading && (
          <div className="loading-state">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton-card card" />
            ))}
          </div>
        )}

        {error && (
          <div className="error-state" role="alert">
            <p>⚠️ {error}</p>
            <button className="btn btn-ghost" onClick={() => refetch()}>Retry</button>
          </div>
        )}

        {!loading && !error && players?.length === 0 && (
          <EmptyState
            icon="👥"
            title={search ? "No results" : "No players yet"}
            description={
              search
                ? `No players matching "${search}"`
                : "Add your first player to get started"
            }
            action={
              !search && (
                <button
                  className="btn btn-primary"
                  onClick={() => setShowForm(true)}
                  id="empty-add-player"
                >
                  Add Player
                </button>
              )
            }
          />
        )}

        {!loading &&
          !error &&
          players?.map((player) => (
            <PlayerCard key={player.id} player={player} />
          ))}
      </div>

      {/* Floating Action Button */}
      <button
        className="fab btn-accent"
        onClick={() => setShowForm(true)}
        id="fab-add-player"
        aria-label="Add new player"
      >
        +
      </button>

      {showForm && (
        <PlayerForm
          onSuccess={handleCreated}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
