import { useState, useEffect } from "react";
import type { PointEndReason, ShotType } from "../api/client";
import "./PointDetailSheet.css";

export interface SheetPlayer {
  id: string;
  name: string;
  side: "a" | "b";
}

interface PointDetailSheetProps {
  matchId: string;
  pointId: number;
  initialDuration: number;
  winningSide: "a" | "b";
  servingSide: "a" | "b" | null;
  players: SheetPlayer[];
  onSave: (data: {
    rally_duration_seconds?: number;
    point_end_reason?: PointEndReason;
    shot_type?: ShotType;
    winning_player_id?: string;
  }) => Promise<void>;
  onSkip: () => void;
}

interface ReasonMeta {
  value: PointEndReason;
  label: string;
  emoji: string;
  loserPlays: boolean;       // true = error by loser, false = winner scored
  autoShot: ShotType | null; // non-null = shot is fixed, no choice needed
  playerLabel: string;
  shotLabel: string | null;
}

const END_REASONS: ReasonMeta[] = [
  {
    value: "net_error",
    label: "Net",
    emoji: "🥅",
    loserPlays: true,
    autoShot: "net_shot",
    playerLabel: "Who hit the net?",
    shotLabel: null,
  },
  {
    value: "serve_error",
    label: "Service Error",
    emoji: "❌",
    loserPlays: true,
    autoShot: "serve",
    playerLabel: "Who faulted?",
    shotLabel: null,
  },
  {
    value: "line_out",
    label: "Line Out",
    emoji: "📏",
    loserPlays: true,
    autoShot: null,
    playerLabel: "Who hit it out?",
    shotLabel: "Shot that went out",
  },
  {
    value: "winner",
    label: "Winner",
    emoji: "🏆",
    loserPlays: false,
    autoShot: null,
    playerLabel: "Who scored?",
    shotLabel: "Winning shot",
  },
];

const LINE_OUT_SHOTS: ShotType[] = ["smash", "drop", "clear", "lob", "drive", "net_shot", "flick", "push", "lift"];
const WINNER_SHOTS: ShotType[] = ["smash", "drop", "clear", "lob", "drive", "net_shot", "serve", "flick", "push", "lift"];

const SHOT_LABELS: Record<ShotType, string> = {
  smash: "Smash", drop: "Drop", clear: "Clear", lob: "Lob", drive: "Drive",
  net_shot: "Net Shot", serve: "Serve", flick: "Flick", push: "Push", lift: "Lift",
};

export default function PointDetailSheet({
  initialDuration,
  winningSide,
  servingSide,
  players,
  onSave,
  onSkip,
}: PointDetailSheetProps) {
  const [endReason, setEndReason] = useState<PointEndReason | null>(null);
  const [shotType, setShotType] = useState<ShotType | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const losingSide: "a" | "b" = winningSide === "a" ? "b" : "a";
  const reasonMeta = END_REASONS.find((r) => r.value === endReason) ?? null;

  // Constraint: service error is impossible when the server won the point
  const serveErrorDisabled = servingSide !== null && servingSide === winningSide;
  // Constraint: serve as a winning shot is impossible when the winner didn't serve
  const serveWinDisabled = servingSide !== null && servingSide !== winningSide;

  // When reason changes: auto-set shot, auto-select player for singles
  useEffect(() => {
    if (!reasonMeta) {
      setShotType(null);
      setPlayerId(null);
      return;
    }
    setShotType(reasonMeta.autoShot);

    const relevantSide = reasonMeta.loserPlays ? losingSide : winningSide;
    const relevantPlayers = players.filter((p) => p.side === relevantSide);
    setPlayerId(relevantPlayers.length === 1 ? relevantPlayers[0].id : null);
  }, [endReason]); // eslint-disable-line react-hooks/exhaustive-deps

  const shotOptions: ShotType[] | null =
    endReason === "line_out" ? LINE_OUT_SHOTS
    : endReason === "winner" ? WINNER_SHOTS
    : null;

  const relevantPlayers = reasonMeta
    ? players.filter((p) => p.side === (reasonMeta.loserPlays ? losingSide : winningSide))
    : [];

  // Show player picker only when there are multiple choices (doubles)
  const showPlayerPicker = endReason !== null && relevantPlayers.length > 1;

  const handleSave = async () => {
    if (!endReason) return;
    setSaving(true);
    await onSave({
      rally_duration_seconds: initialDuration > 0 ? initialDuration : undefined,
      point_end_reason: endReason,
      shot_type: shotType ?? undefined,
      winning_player_id: playerId ?? undefined,
    });
    setSaving(false);
  };

  const selectReason = (value: PointEndReason) => {
    setEndReason((prev) => (prev === value ? null : value));
  };

  return (
    <div className="sheet-overlay" role="dialog" aria-modal="true" aria-label="Point details">
      <div className="sheet-backdrop" onClick={onSkip} />
      <div className="sheet-panel animate-slide-up">
        <div className="sheet-handle" />

        <div className="sheet-content">

          {/* Step 1 — End reason: 4 big buttons */}
          <div className="sheet-section">
            <label className="sheet-label">How did the point end?</label>
            <div className="reason-grid">
              {END_REASONS.map((r) => {
                const disabled = r.value === "serve_error" && serveErrorDisabled;
                return (
                  <button
                    key={r.value}
                    className={`reason-btn ${endReason === r.value ? "reason-btn--active" : ""} ${disabled ? "reason-btn--disabled" : ""}`}
                    onClick={() => !disabled && selectReason(r.value)}
                    title={disabled ? "Server won this point — cannot be a service error" : undefined}
                  >
                    <span className="reason-emoji">{r.emoji}</span>
                    <span className="reason-label">{r.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2 — Shot type: only for line_out / winner */}
          {endReason && shotOptions && (
            <div className="sheet-section animate-fade-in">
              <label className="sheet-label">{reasonMeta!.shotLabel}</label>
              <div className="chip-grid">
                {shotOptions.map((s) => {
                  const shotDisabled = s === "serve" && serveWinDisabled;
                  return (
                    <button
                      key={s}
                      className={`chip ${shotType === s ? "chip--active" : ""} ${shotDisabled ? "chip--disabled" : ""}`}
                      onClick={() => !shotDisabled && setShotType((prev) => (prev === s ? null : s))}
                      title={shotDisabled ? "Only the server can win with a serve" : undefined}
                    >
                      {SHOT_LABELS[s]}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Auto-shot badge for net / serve_error */}
          {endReason && !shotOptions && reasonMeta?.autoShot && (
            <div className="sheet-section">
              <label className="sheet-label">Shot</label>
              <div className="auto-shot-row">
                <span className="auto-shot-pill">
                  {SHOT_LABELS[reasonMeta.autoShot]}
                  <span className="auto-badge">auto</span>
                </span>
              </div>
            </div>
          )}

          {/* Step 3 — Player picker: only for doubles */}
          {showPlayerPicker && (
            <div className="sheet-section animate-fade-in">
              <label className="sheet-label">{reasonMeta!.playerLabel}</label>
              <div className="chip-grid">
                {relevantPlayers.map((p) => (
                  <button
                    key={p.id}
                    className={`chip chip--player ${p.side === "a" ? "chip--a" : "chip--b"} ${playerId === p.id ? "chip--active" : ""}`}
                    onClick={() => setPlayerId((prev) => (prev === p.id ? null : p.id))}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Duration — read-only at bottom */}
          {initialDuration > 0 && (
            <div className="duration-display">
              <span className="duration-display-label">Rally duration</span>
              <span className="duration-display-value">{initialDuration}s</span>
            </div>
          )}

        </div>

        <div className="sheet-actions">
          <button className="btn btn-ghost sheet-skip" onClick={onSkip} disabled={saving}>
            Skip
          </button>
          <button
            className="btn btn-primary sheet-save"
            onClick={handleSave}
            disabled={!endReason || saving}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
