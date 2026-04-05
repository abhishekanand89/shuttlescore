import type { PlayerListItem } from "../api/client";
import { useNavigate } from "react-router-dom";
import "./PlayerCard.css";

interface PlayerCardProps {
  player: PlayerListItem;
}

export default function PlayerCard({ player }: PlayerCardProps) {
  const navigate = useNavigate();

  const initials = player.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <button
      className="player-card card"
      onClick={() => navigate(`/players/${player.id}`)}
      id={`player-card-${player.id}`}
      aria-label={`View ${player.name}'s profile`}
    >
      <div className="player-avatar" aria-hidden="true">
        {initials}
      </div>
      <div className="player-info">
        <span className="player-name">{player.name}</span>
        <span className="player-phone">{player.phone_masked}</span>
      </div>
      <span className="player-arrow" aria-hidden="true">›</span>
    </button>
  );
}
