import { useState } from "react";
import { playerApi } from "../api/client";
import type { CreatePlayerData, Gender, SkillLevel } from "../api/client";
import "./PlayerForm.css";

interface PlayerFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "non_binary", label: "Non-binary" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

const SKILL_OPTIONS: { value: SkillLevel; label: string; desc: string }[] = [
  { value: "beginner", label: "Beginner", desc: "Just starting out" },
  { value: "intermediate", label: "Intermediate", desc: "Regular club play" },
  { value: "advanced", label: "Advanced", desc: "Competitive league" },
  { value: "competitive", label: "Competitive", desc: "Tournament level" },
];

export default function PlayerForm({ onSuccess, onCancel }: PlayerFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<Gender | "">("");
  const [skillLevel, setSkillLevel] = useState<SkillLevel | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPhoneError(null);
    setLoading(true);
    try {
      const data: CreatePlayerData = {
        name: name.trim(),
        phone: phone.trim(),
        ...(age ? { age: parseInt(age) } : {}),
        ...(gender ? { gender } : {}),
        ...(skillLevel ? { skill_level: skillLevel } : {}),
      };
      await playerApi.create(data);
      onSuccess();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create player";
      if (msg.toLowerCase().includes("already registered") || msg.toLowerCase().includes("phone")) {
        setPhoneError(msg);
      } else {
        setError(msg);
      }
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
            placeholder="e.g. Rahul Sharma"
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
            className={`input ${phoneError ? "input--error" : ""}`}
            type="tel"
            placeholder="e.g. 9876543210 (10 digits)"
            value={phone}
            onChange={(e) => { setPhone(e.target.value); setPhoneError(null); }}
            pattern="[0-9+\-\s]{10,15}"
            required
            disabled={loading}
          />
          {phoneError && <span className="field-error">{phoneError}</span>}
        </div>

        <div className="form-row">
          <div className="form-field form-field--half">
            <label htmlFor="player-age" className="label">Age <span className="label-optional">(optional)</span></label>
            <input
              id="player-age"
              className="input"
              type="number"
              placeholder="e.g. 24"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              min={5}
              max={100}
              disabled={loading}
            />
          </div>

          <div className="form-field form-field--half">
            <label htmlFor="player-gender" className="label">Gender <span className="label-optional">(optional)</span></label>
            <select
              id="player-gender"
              className="input"
              value={gender}
              onChange={(e) => setGender(e.target.value as Gender | "")}
              disabled={loading}
            >
              <option value="" disabled hidden>Select gender…</option>
              {GENDER_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-field">
          <label className="label">Skill Level <span className="label-optional">(optional)</span></label>
          <div className="skill-chips">
            {SKILL_OPTIONS.map(o => (
              <button
                key={o.value}
                type="button"
                className={`skill-chip ${skillLevel === o.value ? "skill-chip--active" : ""}`}
                onClick={() => setSkillLevel(skillLevel === o.value ? "" : o.value)}
                disabled={loading}
              >
                <span className="skill-chip-label">{o.label}</span>
                <span className="skill-chip-desc">{o.desc}</span>
              </button>
            ))}
          </div>
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
