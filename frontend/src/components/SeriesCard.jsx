import { useState } from "react";
import { typeLabel, statusMeta, colorForGenre } from "../constants";
import SourcesModal from "./SourcesModal";

const MAX_VISIBLE_GENRES = 3;

export default function SeriesCard({ series, genresById, onView, onEdit, onDeleteRequest }) {
  const [sourcesOpen, setSourcesOpen] = useState(false);

  const status = statusMeta(series.status);
  const allGenres = (series.genre_ids || []).map((id) => genresById[id]).filter(Boolean);
  const visibleGenres = allGenres.slice(0, MAX_VISIBLE_GENRES);
  const remainingCount = allGenres.length - visibleGenres.length;

  const spineColor = visibleGenres[0] ? colorForGenre(visibleGenres[0]) : "var(--accent)";

  const hasTotal = series.total_progress !== null && series.total_progress !== undefined;
  const progressPct =
    hasTotal && series.total_progress > 0
      ? Math.min(100, Math.round((series.current_progress / series.total_progress) * 100))
      : null;

  return (
    <>
      <article className="book-card" style={{ "--spine-color": spineColor }}>
        <div className="book-cover">
          {series.cover_url ? (
            <img src={series.cover_url} alt={series.title} loading="lazy" />
          ) : (
            <span className="book-cover-initial">{series.title.charAt(0).toUpperCase()}</span>
          )}
          <span className="book-type-chip">{typeLabel(series.series_type)}</span>

          <div className="book-hover-actions">
            <button className="book-action-btn" onClick={() => onView(series)}>
              View
            </button>
            <button className="book-action-btn" onClick={() => onEdit(series)}>
              Edit
            </button>
            <button className="book-action-btn book-action-btn-danger" onClick={() => onDeleteRequest(series)}>
              Delete
            </button>
          </div>
        </div>

        <div className="book-info">
          <h3 className="book-title">{series.title}</h3>

          <div className="book-status-row">
            <span className="status-dot" style={{ background: status.color }} />
            <span className="book-status-label">{status.label}</span>
            {series.rating != null && <span className="book-rating">★ {series.rating.toFixed(1)}</span>}
          </div>

          {visibleGenres.length > 0 && (
            <div className="book-genres">
              {visibleGenres.map((g) => (
                <span key={g.id} className="genre-badge" style={{ "--chip-color": colorForGenre(g) }}>
                  {g.name}
                </span>
              ))}
              {remainingCount > 0 && (
                <span className="genre-badge genre-badge-more">+{remainingCount} more</span>
              )}
            </div>
          )}

          <div className="book-progress">
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: progressPct !== null ? `${progressPct}%` : "6%" }}
              />
            </div>
            <span className="progress-label">
              {series.current_progress}
              {hasTotal ? ` / ${series.total_progress}` : ""}
            </span>
          </div>

          {series.sources?.length > 0 && (
            <button className="btn btn-ghost btn-small book-sources-btn" onClick={() => setSourcesOpen(true)}>
              Sources ({series.sources.length})
            </button>
          )}
        </div>
      </article>

      <SourcesModal
        open={sourcesOpen}
        title={series.title}
        sources={series.sources || []}
        onClose={() => setSourcesOpen(false)}
      />
    </>
  );
}
