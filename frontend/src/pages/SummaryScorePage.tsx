import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useApi } from "../hooks/useApi";
import { matchApi } from "../api/client";
import type { GameScoreInput } from "../api/client";
import "./SummaryScorePage.css";

/** Validate a single game score. Returns error string or null if valid. */
function validateGameScore(a: number, b: number): string | null {
  if (isNaN(a) || isNaN(b) || a < 0 || b < 0) return "Scores must be non-negative numbers.";
  if (a === b) return "A game cannot end in a draw.";
  const w = Math.max(a, b);
  const lo = Math.min(a, b);
  const valid =
    (w === 21 && lo <= 19) ||
    (w >= 22 && w <= 30 && w === lo + 2 && lo >= 20) ||
    (w === 30 && lo === 29);
  if (!valid) {
    return `Invalid score ${a}-${b}. Must be 21-x (x≤19), 22-20 through 30-28, or 30-29.`;
  }
  return null;
}

function gameWinner(a: number, b: number): "a" | "b" | null {
  if (!validateGameScore(a, b)) return a > b ? "a" : "b";
  return null;
}

interface GameEntry {
  score_a: string;
  score_b: string;
}

export default function SummaryScorePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: match, loading: matchLoading } = useApi(() => matchApi.get(id!), [id]);

  const [games, setGames] = useState<GameEntry[]>([
    { score_a: "", score_b: "" },
    { score_a: "", score_b: "" },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const updateGame = (index: number, field: "score_a" | "score_b", value: string) => {
    setGames((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };

      // Auto-add or remove 3rd game based on current 2-game result
      const g0a = parseInt(next[0].score_a);
      const g0b = parseInt(next[0].score_b);
      const g1a = parseInt(next[1].score_a);
      const g1b = parseInt(next[1].score_b);

      const w0 = !isNaN(g0a) && !isNaN(g0b) ? gameWinner(g0a, g0b) : null;
      const w1 = !isNaN(g1a) && !isNaN(g1b) ? gameWinner(g1a, g1b) : null;

      const needs3rd = w0 !== null && w1 !== null && w0 !== w1;
      if (needs3rd && next.length === 2) {
        next.push({ score_a: "", score_b: "" });
      } else if (!needs3rd && next.length === 3) {
        next.splice(2, 1);
      }
      return next;
    });
  };

  // Compute per-game validation errors
  const gameErrors: (string | null)[] = games.map((g) => {
    const a = parseInt(g.score_a);
    const b = parseInt(g.score_b);
    if (g.score_a === "" || g.score_b === "") return null; // empty = not yet filled
    return validateGameScore(a, b);
  });

  // Determine if we can submit
  const allFilled = games.every((g) => g.score_a !== "" && g.score_b !== "");
  const hasErrors = gameErrors.some((e) => e !== null);
  const canSubmit = allFilled && !hasErrors && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit || !id) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload: GameScoreInput[] = games.map((g) => ({
        score_a: parseInt(g.score_a),
        score_b: parseInt(g.score_b),
      }));
      await matchApi.submitSummary(id, payload);
      navigate(`/matches/${id}`);
    } catch (err: any) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (matchLoading) {
    return <div className="summary-page"><div className="loading-state">Loading match…</div></div>;
  }

  const teamAName = match?.team_a.players.map((p) => p.name).join(" & ") ?? "Side A";
  const teamBName = match?.team_b.players.map((p) => p.name).join(" & ") ?? "Side B";

  return (
    <div className="summary-page animate-fade-in">
      <div className="summary-header">
        <button className="back-btn" onClick={() => navigate("/matches")}>← Matches</button>
        <h2 className="summary-title">Enter Final Scores</h2>
        <p className="summary-subtitle">Summary mode — record game results only</p>
      </div>

      <div className="summary-teams-row">
        <span className="summary-team-label team-a-label">{teamAName}</span>
        <span className="summary-vs">vs</span>
        <span className="summary-team-label team-b-label">{teamBName}</span>
      </div>

      <div className="games-list">
        {games.map((game, i) => {
          const err = gameErrors[i];
          const a = parseInt(game.score_a);
          const b = parseInt(game.score_b);
          const winner = !isNaN(a) && !isNaN(b) && !err ? gameWinner(a, b) : null;

          return (
            <div key={i} className={`game-entry card ${err ? "game-entry--error" : winner ? "game-entry--valid" : ""}`}>
              <div className="game-entry-header">
                <span className="game-label">Game {i + 1}</span>
                {winner && (
                  <span className="game-winner-badge">
                    {winner === "a" ? teamAName : teamBName} wins
                  </span>
                )}
              </div>
              <div className="score-inputs">
                <input
                  className={`score-input input ${winner === "a" ? "score-input--winner" : ""}`}
                  type="number"
                  inputMode="numeric"
                  min="0"
                  max="30"
                  placeholder="0"
                  value={game.score_a}
                  onChange={(e) => updateGame(i, "score_a", e.target.value)}
                  aria-label={`Game ${i + 1} Score for ${teamAName}`}
                />
                <span className="score-dash">–</span>
                <input
                  className={`score-input input ${winner === "b" ? "score-input--winner" : ""}`}
                  type="number"
                  inputMode="numeric"
                  min="0"
                  max="30"
                  placeholder="0"
                  value={game.score_b}
                  onChange={(e) => updateGame(i, "score_b", e.target.value)}
                  aria-label={`Game ${i + 1} Score for ${teamBName}`}
                />
              </div>
              {err && <p className="game-error">{err}</p>}
            </div>
          );
        })}
      </div>

      {submitError && <div className="form-error">{submitError}</div>}

      <div className="floating-action-bar">
        <button
          className="btn btn-primary start-match-btn"
          disabled={!canSubmit}
          onClick={handleSubmit}
        >
          {submitting ? "Saving…" : "Save Result"}
        </button>
      </div>
    </div>
  );
}
