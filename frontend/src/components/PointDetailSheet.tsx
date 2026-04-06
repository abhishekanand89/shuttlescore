import { useState } from "react";
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
  players: SheetPlayer[];
  onSave: (data: {
    rally_duration_seconds?: number;
    point_end_reason?: PointEndReason;
    shot_type?: ShotType;
    winning_player_id?: string;
  }) => Promise<void>;
  onSkip: () => void;
}

const END_REASONS: { value: PointEndReason; label: string }[] = [
  { value: "winner", label: "Winner" },
  { value: "unforced_error", label: "Unforced Error" },
  { value: "forced_error", label: "Forced Error" },
  { value: "serve_error", label: "Serve Error" },
  { value: "net_error", label: "Net Error" },
  { value: "line_out", label: "Line Out" },
];

const SHOT_TYPES: { value: ShotType; label: string }[] = [
  { value: "smash", label: "Smash" },
  { value: "drop", label: "Drop" },
  { value: "clear", label: "Clear" },
  { value: "lob", label: "Lob" },
  { value: "drive", label: "Drive" },
  { value: "net_shot", label: "Net Shot" },
  { value: "serve", label: "Serve" },
  { value: "flick", label: "Flick" },
  { value: "push", label: "Push" },
  { value: "lift", label: "Lift" },
];

export default function PointDetailSheet({
  initialDuration,
  players,
  onSave,
  onSkip,
}: PointDetailSheetProps) {
  const [duration, setDuration] = useState(initialDuration);
  const [endReason, setEndReason] = useState<PointEndReason | null>(null);
  const [shotType, setShotType] = useState<ShotType | null>(null);
  const [winningPlayer, setWinningPlayer] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave({
      rally_duration_seconds: duration > 0 ? duration : undefined,
      point_end_reason: endReason ?? undefined,
      shot_type: shotType ?? undefined,
      winning_player_id: winningPlayer ?? undefined,
    });
    setSaving(false);
  };

  return (
    <div className="sheet-overlay" role="dialog" aria-modal="true" aria-label="Point details">
      <div className="sheet-backdrop" onClick={onSkip} />
      <div className="sheet-panel animate-slide-up">
        <div className="sheet-handle" />

        <div className="sheet-content">
          {/* Duration */}
          <div className="sheet-section">
            <label className="sheet-label">Rally Duration</label>
            <div className="duration-row">
              <button
                className="duration-btn"
                onClick={() => setDuration((d) => Math.max(0, d - 1))}
                aria-label="Decrease duration"
              >−</button>
              <span className="duration-value">{duration}s</span>
              <button
                className="duration-btn"
                onClick={() => setDuration((d) => d + 1)}
                aria-label="Increase duration"
              >+</button>
            </div>
          </div>

          {/* End reason */}
          <div className="sheet-section">
            <label className="sheet-label">How did the point end?</label>
            <div className="chip-grid">
              {END_REASONS.map((r) => (
                <button
                  key={r.value}
                  className={`chip ${endReason === r.value ? "chip--active" : ""}`}
                  onClick={() => setEndReason(endReason === r.value ? null : r.value)}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Shot type */}
          <div className="sheet-section">
            <label className="sheet-label">Winning shot</label>
            <div className="chip-grid">
              {SHOT_TYPES.map((s) => (
                <button
                  key={s.value}
                  className={`chip ${shotType === s.value ? "chip--active" : ""}`}
                  onClick={() => setShotType(shotType === s.value ? null : s.value)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Winning player */}
          <div className="sheet-section">
            <label className="sheet-label">Played by</label>
            <div className="chip-grid">
              {players.map((p) => (
                <button
                  key={p.id}
                  className={`chip chip--player ${p.side === "a" ? "chip--a" : "chip--b"} ${winningPlayer === p.id ? "chip--active" : ""}`}
                  onClick={() => setWinningPlayer(winningPlayer === p.id ? null : p.id)}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="sheet-actions">
          <button className="btn btn-ghost sheet-skip" onClick={onSkip} disabled={saving}>
            Skip
          </button>
          <button className="btn btn-primary sheet-save" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
