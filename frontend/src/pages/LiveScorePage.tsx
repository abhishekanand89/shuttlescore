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
  winningSide: "a" | "b";
  servingSide: "a" | "b" | null;
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

const CONFETTI_COLORS = ["#1CB0F6", "#FFC800", "#58CC02", "#FF6B00", "#FFFFFF", "#BAE8FF", "#FFE566"];

function ConfettiOverlay() {
  const pieces = Array.from({ length: 32 }, (_, i) => ({
    id: i,
    left: `${(i / 32) * 100 + (Math.random() - 0.5) * 8}%`,
    width: `${7 + Math.random() * 7}px`,
    height: `${7 + Math.random() * 7}px`,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    duration: `${1.6 + Math.random() * 1.8}s`,
    delay: `${Math.random() * 1.2}s`,
    isCircle: i % 3 === 0,
  }));

  return (
    <div className="confetti-overlay">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: p.left,
            width: p.width,
            height: p.height,
            background: p.color,
            animationDuration: p.duration,
            animationDelay: p.delay,
            borderRadius: p.isCircle ? "50%" : "2px",
          }}
        />
      ))}
    </div>
  );
}

export default function LiveScorePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [loadingAction, setLoadingAction] = useState(false);
  const [pendingMetadata, setPendingMetadata] = useState<PendingMetadata | null>(null);
  const [editingPoint, setEditingPoint] = useState<EditingPoint | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [rallyState, setRallyState] = useState<"in_rally" | "between_rallies">("between_rallies");
  const [lastScoredSide, setLastScoredSide] = useState<"a" | "b" | null>(null);
  const [streak, setStreak] = useState<{ side: "a" | "b"; count: number } | null>(null);
  const [manualServerId, setManualServerId] = useState<string | null>(null);
  const [manualServingSide, setManualServingSide] = useState<"a" | "b" | null>(null);
  const [showAbandonDialog, setShowAbandonDialog] = useState(false);
  // Rally timer — only ticks when in_rally
  const rallyStartRef = useRef<number>(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const prevGameNumberRef = useRef<number | null>(null);

  const { data, loading, error, refetch } = useApi(() => matchApi.get(id!));
  const backBlockedRef = useRef(false);

  // Block browser/Android back navigation for in-progress matches
  useEffect(() => {
    if (matchData?.status !== "in_progress") return;

    // Push a sentinel history entry so pressing back pops it instead of leaving
    window.history.pushState({ abandon: true }, "");

    const onPopState = () => {
      if (backBlockedRef.current) return;
      // The sentinel was popped — show the dialog and re-push it
      backBlockedRef.current = true;
      setShowAbandonDialog(true);
      window.history.pushState({ abandon: true }, "");
    };

    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
      // Clean up the sentinel entry if we navigate away programmatically
      if (window.history.state?.abandon) window.history.back();
    };
  }, [matchData?.status]);

  useEffect(() => {
    if (data) setMatchData(data);
  }, [data]);

  // Reset server selection when game number changes
  useEffect(() => {
    const gameNum = matchData?.current_game?.game_number ?? null;
    if (gameNum !== prevGameNumberRef.current) {
      prevGameNumberRef.current = gameNum;
      setManualServerId(null);
      setManualServingSide(null);
    }
  }, [matchData?.current_game?.game_number]);

  // Clear score animation class after it completes
  useEffect(() => {
    if (!lastScoredSide) return;
    const timer = setTimeout(() => setLastScoredSide(null), 500);
    return () => clearTimeout(timer);
  }, [lastScoredSide]);

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
    // Use explicitly selected server, falling back to backend state
    const servingSide = manualServingSide ?? matchData.current_game?.serving_side ?? null;
    try {
      setLoadingAction(true);
      const result = await matchApi.scorePoint(id!, side);
      setLastScoredSide(side);
      setStreak((prev) =>
        prev && prev.side === side
          ? { side, count: prev.count + 1 }
          : { side, count: 1 }
      );
      await refetch();
      setRallyState("between_rallies");
      resetTimer();

      if (isDetailed && result.point?.id != null) {
        setPendingMetadata({ pointId: result.point.id, duration, winningSide: side, servingSide });
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
      setStreak(null);
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

  const { team_a, team_b, current_game, match_type, match_format, winner_side } = matchData;
  const isCompleted = matchData.status === "completed";
  const isBo1 = match_format === "bo1";
  const gamesNeededToWin = isBo1 ? 1 : 2;

  const scoreA = current_game?.score_a ?? 0;
  const scoreB = current_game?.score_b ?? 0;
  const maxScore = Math.max(21, scoreA, scoreB);

  const renderGameDots = (wins: number) => (
    <div className="game-dots">
      {Array.from({ length: gamesNeededToWin }).map((_, i) => (
        <div key={i} className={`dot ${i < wins ? "won" : ""}`}>
          {i < wins ? "★" : "☆"}
        </div>
      ))}
    </div>
  );

  const isGameStart = scoreA === 0 && scoreB === 0 && !isCompleted;
  const needServerSelection = isGameStart && manualServingSide === null;
  const showStartRally = !isCompleted && rallyState === "between_rallies" && !pendingMetadata && !needServerSelection;
  const scoringEnabled = !isCompleted && rallyState === "in_rally";

  const recentPoints = [...matchData.points].reverse().slice(0, 10);
  const showStreak = streak && streak.count >= 3;
  const winnerName = winner_side === "a"
    ? team_a.players[0]?.name
    : team_b.players[0]?.name;
  const streakPlayerName = streak
    ? (streak.side === "a" ? team_a.players[0]?.name : team_b.players[0]?.name)
    : "";

  return (
    <div className="live-score-page animate-fade-in">
      {isCompleted && <ConfettiOverlay />}

      <div className="score-header">
        <button className="back-btn" onClick={() => isCompleted ? navigate("/matches") : setShowAbandonDialog(true)}>←</button>
        <span className="match-info-badge">
          GAME {current_game?.game_number || 1} • {match_type.toUpperCase()}
          {isDetailed && " • DETAILED"}
        </span>
        <button className="undo-btn" onClick={handleUndo} disabled={isCompleted || loadingAction}>
          ↺
        </button>
      </div>

      <div className="scrolling-content">
        {showStreak && (
          <div className="streak-badge">
            🔥 {streakPlayerName} on a {streak!.count}-point streak!
          </div>
        )}

        <div className="score-display">
          {/* Side A */}
          <div className="score-side side-a">
            <div className="team-meta">
              {renderGameDots(team_a.games_won)}
              <div className="players-list">
                {team_a.players.map((p) => (
                  <span key={p.id} className={`player-name ${current_game?.server_id === p.id ? "serving" : ""}`}>
                    {p.name}
                  </span>
                ))}
              </div>
            </div>
            <div className={`big-score a-score ${lastScoredSide === "a" ? "score-bounce" : lastScoredSide === "b" ? "score-shake" : ""}`}>
              {scoreA}
            </div>
            <div className="score-progress">
              <div className="score-progress-fill" style={{ width: `${Math.min(100, (scoreA / maxScore) * 100)}%` }} />
            </div>
          </div>

          <div className="score-divider">:</div>

          {/* Side B */}
          <div className="score-side side-b">
            <div className="team-meta">
              <div className="players-list">
                {team_b.players.map((p) => (
                  <span key={p.id} className={`player-name ${current_game?.server_id === p.id ? "serving" : ""}`}>
                    {p.name}
                  </span>
                ))}
              </div>
              {renderGameDots(team_b.games_won)}
            </div>
            <div className={`big-score b-score ${lastScoredSide === "b" ? "score-bounce" : lastScoredSide === "a" ? "score-shake" : ""}`}>
              {scoreB}
            </div>
            <div className="score-progress">
              <div className="score-progress-fill" style={{ width: `${Math.min(100, (scoreB / maxScore) * 100)}%` }} />
            </div>
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
          <div className="match-winner-banner">
            <h3>Match Completed</h3>
            <p>🏆 {winnerName} Wins!</p>
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
          {needServerSelection ? (
            <div className="server-picker">
              <p className="server-picker-label">Who serves first?</p>
              <div className="server-picker-chips">
                {[
                  ...team_a.players.map((p) => ({ ...p, side: "a" as const })),
                  ...team_b.players.map((p) => ({ ...p, side: "b" as const })),
                ].map((p) => (
                  <button
                    key={p.id}
                    className={`server-chip server-chip--${p.side} ${manualServerId === p.id ? "server-chip--active" : ""}`}
                    onClick={() => { setManualServerId(p.id); setManualServingSide(p.side); }}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          ) : showStartRally ? (
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
          winningSide={pendingMetadata.winningSide}
          servingSide={pendingMetadata.servingSide}
          players={sheetPlayers}
          onSave={handleSaveMetadata}
          onSkip={handleSkipMetadata}
        />
      )}


      {/* Metadata sheet — retroactive edit (serving side unknown, no constraints) */}
      {editingPoint && !pendingMetadata && editingPoint.existing.scoring_side !== "start" && (
        <PointDetailSheet
          matchId={id!}
          pointId={editingPoint.pointId}
          initialDuration={editingPoint.existing.rally_duration_seconds ?? 0}
          winningSide={editingPoint.existing.scoring_side as "a" | "b"}
          servingSide={null}
          players={sheetPlayers}
          onSave={handleSaveMetadata}
          onSkip={handleSkipMetadata}
        />
      )}

      {/* Abandon match confirmation dialog */}
      {showAbandonDialog && (
        <div className="abandon-overlay" onClick={() => { setShowAbandonDialog(false); backBlockedRef.current = false; }}>
          <div className="abandon-dialog" onClick={(e) => e.stopPropagation()}>
            <span className="abandon-icon">⚠️</span>
            <h3 className="abandon-title">Abandon match?</h3>
            <p className="abandon-body">
              The current match data will be discarded. This action cannot be undone.
            </p>
            <div className="abandon-actions">
              <button
                className="abandon-btn abandon-btn--cancel"
                onClick={() => { setShowAbandonDialog(false); backBlockedRef.current = false; }}
              >
                Keep Playing
              </button>
              <button
                className="abandon-btn abandon-btn--confirm"
                onClick={() => {
                  setShowAbandonDialog(false);
                  backBlockedRef.current = false;
                  // Go back past the sentinel entry
                  window.history.go(-2);
                }}
              >
                Abandon
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
