import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useApi } from "../hooks/useApi";
import { matchApi } from "../api/client";
import type { MatchData, PointDetail, PointEndReason, ShotType } from "../api/client";
import PointDetailSheet from "../components/PointDetailSheet";
import type { SheetPlayer } from "../components/PointDetailSheet";
import "./LiveScorePage.css";

interface PendingMetadata {
  pointId: number;
  duration: number;
}

interface EditingPoint {
  pointId: number;
  existing: PointDetail;
}

const END_REASON_LABELS: Record<string, string> = {
  winner: "Winner",
  unforced_error: "Unforced Err",
  forced_error: "Forced Err",
  serve_error: "Serve Err",
  net_error: "Net Err",
  line_out: "Line Out",
};

const SHOT_LABELS: Record<string, string> = {
  smash: "Smash", drop: "Drop", clear: "Clear", lob: "Lob", drive: "Drive",
  net_shot: "Net Shot", serve: "Serve", flick: "Flick", push: "Push", lift: "Lift",
};

export default function LiveScorePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [loadingAction, setLoadingAction] = useState(false);
  const [pendingMetadata, setPendingMetadata] = useState<PendingMetadata | null>(null);
  const [editingPoint, setEditingPoint] = useState<EditingPoint | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [rallyState, setRallyState] = useState<"in_rally" | "between_rallies">("between_rallies");

  // Rally timer — only ticks when in_rally
  const rallyStartRef = useRef<number>(Date.now());
  const [elapsed, setElapsed] = useState(0);

  const { data, loading, error, refetch } = useApi(() => matchApi.get(id!));

  useEffect(() => {
    if (data) setMatchData(data);
  }, [data]);

  // Tick timer every second — only while actively in a rally
  useEffect(() => {
    if (matchData?.status === "completed" || rallyState !== "in_rally") return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - rallyStartRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [matchData?.status, rallyState]);

  const isDetailed = matchData?.tracking_level === "detailed";

  // Build players list for detail sheet
  const sheetPlayers: SheetPlayer[] = matchData
    ? [
        ...matchData.team_a.players.map((p) => ({ id: p.id, name: p.name, side: "a" as const })),
        ...matchData.team_b.players.map((p) => ({ id: p.id, name: p.name, side: "b" as const })),
      ]
    : [];

  const resetTimer = useCallback(() => {
    rallyStartRef.current = Date.now();
    setElapsed(0);
  }, []);

  const handleStartRally = () => {
    rallyStartRef.current = Date.now();
    setElapsed(0);
    setRallyState("in_rally");
  };

  const handleScore = async (side: "a" | "b") => {
    if (!matchData || matchData.status === "completed" || loadingAction) return;
    if (rallyState !== "in_rally") return;
    const duration = Math.floor((Date.now() - rallyStartRef.current) / 1000);
    try {
      setLoadingAction(true);
      const result = await matchApi.scorePoint(id!, side);
      await refetch();
      setRallyState("between_rallies");
      resetTimer();

      if (isDetailed && result.point?.id != null) {
        setPendingMetadata({ pointId: result.point.id, duration });
      }
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
      resetTimer();
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleSaveMetadata = async (data: {
    rally_duration_seconds?: number;
    point_end_reason?: PointEndReason;
    shot_type?: ShotType;
    winning_player_id?: string;
  }) => {
    const targetId = pendingMetadata?.pointId ?? editingPoint?.pointId;
    if (!id || !targetId) return;
    await matchApi.updatePointMetadata(id, targetId, data);
    await refetch();
    setPendingMetadata(null);
    setEditingPoint(null);
  };

  const handleSkipMetadata = () => {
    setPendingMetadata(null);
    setEditingPoint(null);
  };

  if (loading && !matchData) return <div className="detail-page"><div className="loading-state">Loading match…</div></div>;
  if (error || !matchData) return <div className="detail-page"><div className="error-state">⚠️ {error || "Match not found"}</div></div>;

  const { team_a, team_b, current_game, status, match_type, match_format, winner_side } = matchData;
  const isCompleted = status === "completed";
  const isBo1 = match_format === "bo1";
  const gamesNeededToWin = isBo1 ? 1 : 2;

  const renderGameDots = (wins: number) => (
    <div className="game-dots">
      {Array.from({ length: gamesNeededToWin }).map((_, i) => (
        <div key={i} className={`dot ${i < wins ? "won" : ""}`} />
      ))}
    </div>
  );

  // "Start Rally" is shown when between rallies and no metadata sheet is open
  const showStartRally = !isCompleted && rallyState === "between_rallies" && !pendingMetadata;
  // Score buttons are only active during a rally
  const scoringEnabled = !isCompleted && rallyState === "in_rally";

  const recentPoints = [...matchData.points].reverse().slice(0, 10);

  return (
    <div className="live-score-page animate-fade-in">
      <div className="score-header">
        <button className="back-btn" onClick={() => navigate("/matches")}>← Back</button>
        <span className="match-info-badge">
          GAME {current_game?.game_number || 1} • {match_type.toUpperCase()}
          {isDetailed && " • DETAILED"}
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
                {team_a.players.map((p) => (
                  <span key={p.id} className={`player-name ${current_game?.server_id === p.id ? "serving" : ""}`}>
                    {current_game?.server_id === p.id && "🏸 "}{p.name}
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
                {team_b.players.map((p) => (
                  <span key={p.id} className={`player-name ${current_game?.server_id === p.id ? "serving" : ""}`}>
                    {current_game?.server_id === p.id && "🏸 "}{p.name}
                  </span>
                ))}
              </div>
              {renderGameDots(team_b.games_won)}
            </div>
            <div className="big-score b-score">{current_game?.score_b ?? 0}</div>
          </div>
        </div>

        {/* Rally timer (detailed mode only) */}
        {isDetailed && !isCompleted && (
          <div className={`rally-timer ${rallyState === "in_rally" ? "rally-timer--active" : "rally-timer--paused"}`}>
            <span className="rally-timer-label">{rallyState === "in_rally" ? "Rally" : "Paused"}</span>
            <span className="rally-timer-value">{elapsed}s</span>
          </div>
        )}

        {isCompleted && (
          <div className="match-winner-banner animate-slide-up">
            <h3>Match Completed</h3>
            <p>Team {winner_side === "a" ? "A" : "B"} Wins!</p>
          </div>
        )}

        {/* Point history (detailed mode or completed) */}
        {(isDetailed || isCompleted) && matchData.points.length > 0 && (
          <div className="point-history">
            <button
              className="history-toggle"
              onClick={() => setShowHistory((v) => !v)}
            >
              {showHistory ? "▲" : "▼"} Point History ({matchData.points.length})
            </button>

            {showHistory && (
              <div className="history-list">
                {recentPoints.map((pt) => {
                  const playerName = [...team_a.players, ...team_b.players].find(
                    (p) => p.id === pt.winning_player_id
                  )?.name;
                  const sideColor = pt.scoring_side === "a" ? "history-side--a" : "history-side--b";
                  return (
                    <button
                      key={pt.id}
                      className="history-row"
                      onClick={() => setEditingPoint({ pointId: pt.id, existing: pt })}
                      aria-label={`Edit point ${pt.id} details`}
                    >
                      <span className={`history-side ${sideColor}`}>
                        {pt.scoring_side === "a" ? "A" : "B"}
                      </span>
                      <span className="history-score">
                        {pt.score_a_after}–{pt.score_b_after}
                      </span>
                      <span className="history-meta">
                        {pt.shot_type ? SHOT_LABELS[pt.shot_type] ?? pt.shot_type : ""}
                        {pt.point_end_reason ? ` · ${END_REASON_LABELS[pt.point_end_reason] ?? pt.point_end_reason}` : ""}
                        {pt.rally_duration_seconds != null ? ` · ${pt.rally_duration_seconds}s` : ""}
                        {playerName ? ` · ${playerName}` : ""}
                        {!pt.shot_type && !pt.point_end_reason && !pt.rally_duration_seconds ? (
                          <span className="history-add-hint">+ add detail</span>
                        ) : null}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {!isCompleted && (
        <div className="score-buttons">
          {showStartRally ? (
            <button
              className="score-btn start-rally-btn"
              onClick={handleStartRally}
              disabled={loadingAction}
            >
              🏸 Start Rally
            </button>
          ) : (
            <>
              <button
                className="score-btn score-btn-a"
                onClick={() => handleScore("a")}
                disabled={!scoringEnabled || loadingAction}
              >
                + Point
              </button>
              <button
                className="score-btn score-btn-b"
                onClick={() => handleScore("b")}
                disabled={!scoringEnabled || loadingAction}
              >
                + Point
              </button>
            </>
          )}
        </div>
      )}

      {/* Metadata sheet — after scoring */}
      {pendingMetadata && (
        <PointDetailSheet
          matchId={id!}
          pointId={pendingMetadata.pointId}
          initialDuration={pendingMetadata.duration}
          players={sheetPlayers}
          onSave={handleSaveMetadata}
          onSkip={handleSkipMetadata}
        />
      )}

      {/* Metadata sheet — retroactive edit */}
      {editingPoint && !pendingMetadata && (
        <PointDetailSheet
          matchId={id!}
          pointId={editingPoint.pointId}
          initialDuration={editingPoint.existing.rally_duration_seconds ?? 0}
          players={sheetPlayers}
          onSave={handleSaveMetadata}
          onSkip={handleSkipMetadata}
        />
      )}
    </div>
  );
}
