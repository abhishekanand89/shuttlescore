import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useApi } from "../hooks/useApi";
import { matchApi } from "../api/client";
import type { MatchData } from "../api/client";
import "./LiveScorePage.css";

export default function LiveScorePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [loadingAction, setLoadingAction] = useState(false);

  // Initial fetch
  const { data, loading, error, refetch } = useApi(() => matchApi.get(id!));

  useEffect(() => {
    if (data) setMatchData(data);
  }, [data]);

  const handleScore = async (side: "a" | "b") => {
    if (!matchData || matchData.status === "completed" || loadingAction) return;
    try {
      setLoadingAction(true);
      await matchApi.scorePoint(id!, side);
      // Wait, endpoint returns wrapper, we should just refetch the whole match 
      // or update state optimistically. For safety, let's just refetch.
      await refetch();
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleUndo = async () => {
    if (loadingAction) return;
    try {
      setLoadingAction(true);
      await matchApi.undoPoint(id!);
      await refetch();
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAction(false);
    }
  };

  if (loading && !matchData) return <div className="detail-page"><div className="loading-state">Loading match...</div></div>;
  if (error || !matchData) return <div className="detail-page"><div className="error-state">⚠️ {error || "Match not found"}</div></div>;

  const { team_a, team_b, current_game, status, match_type, winner_side } = matchData;

  const isCompleted = status === "completed";
  
  // Game dots logic (best of 3 means 2 dots max per team, but let's just show games won)
  const renderGameDots = (wins: number) => {
    return (
      <div className="game-dots">
        {[0, 1].map(i => <div key={i} className={`dot ${i < wins ? "won" : ""}`} />)}
      </div>
    );
  };

  return (
    <div className="live-score-page animate-fade-in">
      <div className="score-header">
        <button className="back-btn" onClick={() => navigate("/matches")}>← Back</button>
        <span className="match-info-badge">
          GAME {current_game?.game_number || 1} • {match_type.toUpperCase()}
        </span>
        <button className="undo-btn" onClick={handleUndo} disabled={isCompleted || loadingAction}>
          ↺ Undo
        </button>
      </div>

      <div className="scrolling-content">
        <div className="score-display">
          {/* Side A */}
          <div className="score-side side-a">
            <div className="team-meta">
              {renderGameDots(team_a.games_won)}
              <div className="players-list">
                {team_a.players.map(p => (
                  <span key={p.id} className={`player-name ${current_game?.server_id === p.id ? "serving" : ""}`}>
                    {current_game?.server_id === p.id && "🏸 "} {p.name}
                  </span>
                ))}
              </div>
            </div>
            <div className="big-score a-score">{current_game?.score_a ?? 0}</div>
          </div>
          
          <div className="score-divider">:</div>

          {/* Side B */}
          <div className="score-side side-b">
            <div className="team-meta">
              <div className="players-list">
                {team_b.players.map(p => (
                  <span key={p.id} className={`player-name ${current_game?.server_id === p.id ? "serving" : ""}`}>
                    {current_game?.server_id === p.id && "🏸 "} {p.name}
                  </span>
                ))}
              </div>
              {renderGameDots(team_b.games_won)}
            </div>
            <div className="big-score b-score">{current_game?.score_b ?? 0}</div>
          </div>
        </div>

        {isCompleted && (
          <div className="match-winner-banner animate-slide-up">
            <h3>Match Completed</h3>
            <p>Team {winner_side === "a" ? "A" : "B"} Wins!</p>
          </div>
        )}
      </div>

      {!isCompleted && (
        <div className="score-buttons">
          <button 
            className="score-btn score-btn-a" 
            onClick={() => handleScore("a")}
            disabled={loadingAction}
          >
            + Point
          </button>
          <button 
            className="score-btn score-btn-b"
            onClick={() => handleScore("b")}
            disabled={loadingAction}
          >
            + Point
          </button>
        </div>
      )}
    </div>
  );
}
