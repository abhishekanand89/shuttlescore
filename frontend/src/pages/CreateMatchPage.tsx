import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApi } from "../hooks/useApi";
import { playerApi, matchApi, tournamentApi } from "../api/client";
import "./CreateMatchPage.css";

export default function CreateMatchPage() {
  const navigate = useNavigate();
  const { data: players } = useApi(() => playerApi.list());
  const { data: activeTournaments } = useApi(() => tournamentApi.list("active"));
  
  const [matchType, setMatchType] = useState<"singles" | "doubles">("singles");
  const [teamA, setTeamA] = useState<string[]>([]);
  const [teamB, setTeamB] = useState<string[]>([]);
  const [server, setServer] = useState<string>("");
  const [tournamentId, setTournamentId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const neededPerTeam = matchType === "singles" ? 1 : 2;
  const isComplete = teamA.length === neededPerTeam && teamB.length === neededPerTeam && server !== "";

  const togglePlayer = (id: string, team: "a" | "b") => {
    const list = team === "a" ? teamA : teamB;
    const setList = team === "a" ? setTeamA : setTeamB;
    const otherList = team === "a" ? teamB : teamA;
    const setOtherList = team === "a" ? setTeamB : setTeamA;

    if (list.includes(id)) {
      setList(list.filter((x) => x !== id));
      if (server === id) setServer("");
    } else {
      if (otherList.includes(id)) {
        setOtherList(otherList.filter((x) => x !== id));
      }
      if (list.length < neededPerTeam) {
        setList([...list, id]);
        if (!server) setServer(id);
      }
    }
  };

  const handleSubmit = async () => {
    if (!isComplete) return;
    setLoading(true);
    setError(null);
    try {
      const res = await matchApi.create({
        match_type: matchType,
        team_a_player_ids: teamA,
        team_b_player_ids: teamB,
        first_server_id: server,
        tournament_id: tournamentId || undefined,
      });
      navigate(`/matches/${res.id}`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (!players) return <div className="loading-state">Loading players...</div>;

  return (
    <div className="create-match-page animate-fade-in">
      <div className="header-row">
        <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
        <h2 className="page-title">New Match</h2>
      </div>

      {error && <div className="form-error">{error}</div>}

      <div className="match-type-toggle">
        <button
          className={`toggle-btn ${matchType === "singles" ? "active" : ""}`}
          onClick={() => { setMatchType("singles"); setTeamA([]); setTeamB([]); setServer(""); }}
        >
          Singles
        </button>
        <button
          className={`toggle-btn ${matchType === "doubles" ? "active" : ""}`}
          onClick={() => { setMatchType("doubles"); setTeamA([]); setTeamB([]); setServer(""); }}
        >
          Doubles
        </button>
      </div>

      <div className="teams-container">
        {/* Team A */}
        <div className="team-selector">
          <h3 className="team-title text-a">Side A ({teamA.length}/{neededPerTeam})</h3>
          <div className="player-chips">
            {players.map((p) => {
              const inA = teamA.includes(p.id);
              const inB = teamB.includes(p.id);
              if (inB) return null;
              return (
                <button
                  key={p.id}
                  className={`player-chip ${inA ? "selected bg-primary" : ""}`}
                  onClick={() => togglePlayer(p.id, "a")}
                >
                  {p.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Team B */}
        <div className="team-selector">
          <h3 className="team-title text-b">Side B ({teamB.length}/{neededPerTeam})</h3>
          <div className="player-chips">
            {players.map((p) => {
              const inA = teamA.includes(p.id);
              const inB = teamB.includes(p.id);
              if (inA) return null;
              return (
                <button
                  key={p.id}
                  className={`player-chip ${inB ? "selected bg-accent" : ""}`}
                  onClick={() => togglePlayer(p.id, "b")}
                >
                  {p.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Server selector */}
      {teamA.length > 0 || teamB.length > 0 ? (
        <div className="server-selector animate-slide-up">
          <h3 className="section-title">Who serves first?</h3>
          <div className="player-chips">
            {[...teamA, ...teamB].map(id => {
              const p = players.find(x => x.id === id);
              return (
                <button
                  key={id}
                  className={`player-chip ${server === id ? "selected border-active" : ""}`}
                  onClick={() => setServer(id)}
                >
                  🏸 {p?.name}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Tournament Linkage */}
      {activeTournaments && activeTournaments.length > 0 && (
        <div className="tournament-selector animate-slide-up" style={{ marginBottom: "16px", background: "var(--color-surface)", padding: "16px", borderRadius: "12px", border: "1px solid var(--color-border)" }}>
          <h3 className="section-title" style={{ fontSize: "14px", marginTop: "0", marginBottom: "12px" }}>Link to Tournament (Optional)</h3>
          <select 
            className="input" 
            value={tournamentId} 
            onChange={(e) => setTournamentId(e.target.value)}
            style={{ width: "100%", padding: "12px", background: "var(--color-bg-secondary)" }}
          >
            <option value="">None (Free Play)</option>
            {activeTournaments.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="floating-action-bar">
        <button
          className="btn btn-primary start-match-btn"
          disabled={!isComplete || loading}
          onClick={handleSubmit}
        >
          {loading ? "Creating..." : "Start Match"}
        </button>
      </div>
    </div>
  );
}
