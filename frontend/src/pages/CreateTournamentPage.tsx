import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { tournamentApi } from "../api/client";

export default function CreateTournamentPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("upcoming");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await tournamentApi.create({
        name: name.trim(),
        description: description.trim() || undefined,
        status,
      });
      navigate("/tournaments");
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="create-tournament-page animate-fade-in">
      <div className="header-row" style={{ marginBottom: "24px" }}>
        <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
        <h2 className="page-title">New Tournament</h2>
      </div>

      <form className="card" onSubmit={handleSubmit}>
        {error && <div className="form-error">{error}</div>}

        <div className="form-group" style={{ marginBottom: "16px" }}>
          <label className="label">Tournament Name</label>
          <input
            type="text"
            className="input"
            placeholder="e.g. Summer Open 2026"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div className="form-group" style={{ marginBottom: "16px" }}>
          <label className="label">Description (Optional)</label>
          <textarea
            className="input"
            placeholder="Brief details about the context..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        <div className="form-group" style={{ marginBottom: "24px" }}>
          <label className="label">Status</label>
          <select 
            className="input" 
            value={status} 
            onChange={(e) => setStatus(e.target.value)}
            style={{ width: "100%", padding: "12px", background: "var(--color-bg-secondary)" }}
          >
            <option value="upcoming">Upcoming</option>
            <option value="active">Active</option>
          </select>
        </div>

        <button 
          type="submit" 
          className="btn btn-primary" 
          style={{ width: "100%" }}
          disabled={!name.trim() || loading}
        >
          {loading ? "Creating..." : "Create Tournament"}
        </button>
      </form>
    </div>
  );
}
