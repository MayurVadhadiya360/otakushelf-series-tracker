import { useEffect, useState } from "react";
import { SERIES_TYPES, SERIES_STATUSES } from "../constants";
import GenreInput from "./GenreInput";
import SourcesInput from "./SourcesInput";
import useBodyScrollLock from "../hooks/useBodyScrollLock";

const emptyForm = {
  title: "",
  series_type: "novel",
  status: "planning",
  current_progress: 0,
  total_progress: "",
  rating: "",
  notes: "",
  cover_url: "",
  genre_ids: [],
  sources: [],
};

export default function SeriesFormDrawer({
  open,
  initialValue,
  allGenres,
  onCreateGenre,
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useBodyScrollLock(open);

  useEffect(() => {
    if (initialValue) {
      setForm({
        title: initialValue.title ?? "",
        series_type: initialValue.series_type ?? "novel",
        status: initialValue.status ?? "planning",
        current_progress: initialValue.current_progress ?? 0,
        total_progress: initialValue.total_progress ?? "",
        rating: initialValue.rating ?? "",
        notes: initialValue.notes ?? "",
        cover_url: initialValue.cover_url ?? "",
        genre_ids: initialValue.genre_ids ?? [],
        sources: initialValue.sources ?? [],
      });
    } else {
      setForm(emptyForm);
    }
    setError("");
  }, [initialValue, open]);

  if (!open) return null;

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.title.trim()) {
      setError("Give the series a title.");
      return;
    }
    const cleanSources = form.sources.filter((s) => s.url && s.url.trim());
    if (form.sources.length > 0 && cleanSources.length === 0) {
      setError("Each source needs a URL, or remove the empty ones.");
      return;
    }

    const payload = {
      title: form.title.trim(),
      series_type: form.series_type,
      status: form.status,
      current_progress: Number(form.current_progress) || 0,
      total_progress: form.total_progress === "" ? null : Number(form.total_progress),
      rating: form.rating === "" ? null : Number(form.rating),
      notes: form.notes.trim() || null,
      cover_url: form.cover_url.trim() || null,
      genre_ids: form.genre_ids,
      sources: cleanSources.map((s) => ({
        platform_name: s.platform_name?.trim() || null,
        url: s.url.trim(),
        is_primary: !!s.is_primary,
      })),
    };

    try {
      setSubmitting(true);
      await onSubmit(payload);
    } catch (err) {
      setError(err?.response?.data?.detail || "Couldn't save this entry. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <h2>{initialValue ? "Edit entry" : "Add to your shelf"}</h2>
          <button className="btn btn-ghost btn-small" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <form className="drawer-form" onSubmit={handleSubmit}>
          {error && <div className="form-error">{error}</div>}

          <label className="field">
            <span>Title</span>
            <input
              type="text"
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="e.g. Solo Leveling"
              autoFocus
            />
          </label>

          <div className="field-row">
            <label className="field">
              <span>Type</span>
              <select value={form.series_type} onChange={(e) => update("series_type", e.target.value)}>
                {SERIES_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Status</span>
              <select value={form.status} onChange={(e) => update("status", e.target.value)}>
                {SERIES_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="field-row">
            <label className="field">
              <span>Current chapter / episode</span>
              <input
                type="number"
                min="0"
                value={form.current_progress}
                onChange={(e) => update("current_progress", e.target.value)}
              />
            </label>

            <label className="field">
              <span>Total (if known)</span>
              <input
                type="number"
                min="0"
                value={form.total_progress}
                onChange={(e) => update("total_progress", e.target.value)}
                placeholder="Ongoing"
              />
            </label>
          </div>

          <div className="field-row">
            <label className="field">
              <span>Your rating (0–10)</span>
              <input
                type="number"
                min="0"
                max="10"
                step="0.5"
                value={form.rating}
                onChange={(e) => update("rating", e.target.value)}
                placeholder="Not rated"
              />
            </label>

            <label className="field">
              <span>Cover image URL</span>
              <input
                type="text"
                value={form.cover_url}
                onChange={(e) => update("cover_url", e.target.value)}
                placeholder="https://…"
              />
            </label>
          </div>

          {/* Plain <div>, not <label>: a <label> with no `for` attribute
              implicitly forwards clicks to the FIRST form control found
              inside it. GenreInput renders each chip's delete (×) button
              before its text input, so an implicit label here would silently
              remove the first genre whenever the caption, chip text, or any
              non-button area was clicked. */}
          <div className="field">
            <span>Genres</span>
            <GenreInput
              allGenres={allGenres}
              selectedIds={form.genre_ids}
              onChange={(ids) => update("genre_ids", ids)}
              onCreateGenre={onCreateGenre}
            />
          </div>

          {/* Same reasoning as Genres above — SourcesInput also contains
              multiple buttons/inputs, so it gets a plain <div> too rather
              than relying on implicit label-to-first-control forwarding. */}
          <div className="field">
            <span>Where to read / watch it</span>
            <SourcesInput sources={form.sources} onChange={(s) => update("sources", s)} />
          </div>

          <label className="field">
            <span>Notes</span>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              placeholder="Thoughts, where you left off, anything worth remembering…"
            />
          </label>

          <div className="drawer-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Saving…" : initialValue ? "Save changes" : "Add to shelf"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
