import { useNavigate } from "react-router-dom";
import { useApi } from "../hooks/useApi";
import { matchApi } from "../api/client";
import EmptyState from "../components/EmptyState";
import "./MatchesPage.css";

export default function MatchesPage() {
  const navigate = useNavigate();
  const { data: matches, loading, error } = useApi(() => matchApi.list());

  return (
    <div className="matches-page animate-fade-in">
      <div className="page-header">
        <h2 className="page-title">Matches</h2>
        <span className="match-count">{matches?.length ?? 0}</span>
      </div>

      <div className="match-list">
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
          </div>
        )}

        {!loading && !error && matches?.length === 0 && (
          <EmptyState
            icon="🏆"
            title="No matches yet"
            description="Start your first badminton match to track scores point by point."
            action={
              <button
                className="btn btn-primary"
                onClick={() => navigate("/matches/new")}
                id="empty-new-match"
              >
                New Match
              </button>
            }
          />
        )}

        {!loading &&
          !error &&
          matches?.map((match) => (
            <button
              key={match.id}
              className="match-card card"
              onClick={() => navigate(`/matches/${match.id}`)}
              id={`match-card-${match.id}`}
            >
              <div className="match-card-header">
                <span className={`match-badge match-badge--${match.status}`}>
                  {match.status === "in_progress" ? "Live" : "Finished"}
                </span>
                <span className="match-type">{match.match_type}</span>
              </div>
              <div className="match-card-teams">
                <div className={`team-row ${match.winner_side === "a" ? "team-winner" : ""}`}>
                  <span className="team-names">{match.team_a.player_names?.join(" & ")}</span>
                  <span className="team-score">
                    {match.current_score ? match.current_score.a : match.team_a.games_won}
                  </span>
                </div>
                <div className="team-divider">vs</div>
                <div className={`team-row ${match.winner_side === "b" ? "team-winner" : ""}`}>
                  <span className="team-names">{match.team_b.player_names?.join(" & ")}</span>
                  <span className="team-score">
                    {match.current_score ? match.current_score.b : match.team_b.games_won}
                  </span>
                </div>
              </div>
            </button>
          ))}
      </div>

      <button
        className="fab btn-accent"
        onClick={() => navigate("/matches/new")}
        id="fab-new-match"
        aria-label="Start new match"
      >
        +
      </button>
    </div>
  );
}
