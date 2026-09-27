import { useState } from "react";
import { colorForGenre } from "../constants";

/**
 * props:
 *  - allGenres: [{ id, name, color, usage_count }]
 *  - selectedIds: string[]
 *  - onChange: (nextSelectedIds: string[]) => void
 *  - onCreateGenre: (name: string) => Promise<genre>  — creates + returns the new genre
 */
export default function GenreInput({ allGenres, selectedIds, onChange, onCreateGenre }) {
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const selected = allGenres.filter((g) => selectedIds.includes(g.id));
  const trimmed = query.trim();

  const suggestions = trimmed
    ? allGenres
        .filter(
          (g) =>
            !selectedIds.includes(g.id) &&
            g.name.toLowerCase().includes(trimmed.toLowerCase())
        )
        .slice(0, 8)
    : [];

  const exactMatch = allGenres.some(
    (g) => g.name.toLowerCase() === trimmed.toLowerCase()
  );

  function toggleGenre(id) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  }

  async function handleCreate() {
    if (!trimmed || exactMatch || creating) return;
    setError("");
    setCreating(true);
    try {
      const newGenre = await onCreateGenre(trimmed);
      onChange([...selectedIds, newGenre.id]);
      setQuery("");
    } catch (err) {
      setError(err?.response?.data?.detail || "Couldn't create that genre.");
    } finally {
      setCreating(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (trimmed && !exactMatch) {
        handleCreate();
      } else if (suggestions.length > 0) {
        toggleGenre(suggestions[0].id);
        setQuery("");
      }
    }
  }

  return (
    <div className="genre-input">
      {selected.length > 0 && (
        <div className="genre-chips-selected">
          {selected.map((g) => (
            <span
              key={g.id}
              className="genre-chip genre-chip-selected"
              style={{ "--chip-color": colorForGenre(g) }}
            >
              {g.name}
              <button type="button" onClick={() => toggleGenre(g.id)} aria-label={`Remove ${g.name}`}>
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search or add a genre…"
      />

      {error && <div className="form-error form-error-small">{error}</div>}

      {trimmed && (
        <div className="genre-suggestions">
          {suggestions.map((g) => (
            <button
              type="button"
              key={g.id}
              className="genre-suggestion"
              onClick={() => {
                toggleGenre(g.id);
                setQuery("");
              }}
            >
              <span className="genre-suggestion-dot" style={{ background: colorForGenre(g) }} />
              {g.name}
            </button>
          ))}
          {!exactMatch && (
            <button
              type="button"
              className="genre-suggestion genre-suggestion-create"
              onClick={handleCreate}
              disabled={creating}
            >
              {creating ? "Adding…" : `+ Create "${trimmed}"`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
