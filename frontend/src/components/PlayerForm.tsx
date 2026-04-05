import { useState } from "react";
import { playerApi, type CreatePlayerData } from "../api/client";
import "./PlayerForm.css";

interface PlayerFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function PlayerForm({ onSuccess, onCancel }: PlayerFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data: CreatePlayerData = { name: name.trim(), phone: phone.trim() };
      await playerApi.create(data);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create player");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay animate-fade-in" onClick={onCancel}>
      <form
        className="player-form animate-slide-up"
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        id="player-form"
      >
        <h2 className="form-title">New Player</h2>

        {error && (
          <div className="form-error" role="alert" id="form-error">
            {error}
          </div>
        )}

        <div className="form-field">
          <label htmlFor="player-name" className="label">Name</label>
          <input
            id="player-name"
            className="input"
            type="text"
            placeholder="Enter player name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            minLength={2}
            maxLength={50}
            required
            autoFocus
            disabled={loading}
          />
        </div>

        <div className="form-field">
          <label htmlFor="player-phone" className="label">Phone Number</label>
          <input
            id="player-phone"
            className="input"
            type="tel"
            placeholder="10-digit phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            pattern="[0-9+\-\s]{10,15}"
            required
            disabled={loading}
          />
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onCancel}
            disabled={loading}
            id="cancel-player"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || name.trim().length < 2}
            id="submit-player"
          >
            {loading ? "Creating..." : "Add Player"}
          </button>
        </div>
      </form>
    </div>
  );
}
