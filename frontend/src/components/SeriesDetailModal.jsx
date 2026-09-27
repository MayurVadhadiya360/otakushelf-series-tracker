import { typeLabel, statusMeta, colorForGenre } from "../constants";
import useBodyScrollLock from "../hooks/useBodyScrollLock";

export default function SeriesDetailModal({ open, series, genresById, onClose, onEdit }) {
  useBodyScrollLock(open);

  if (!open || !series) return null;

  const status = statusMeta(series.status);
  const genres = (series.genre_ids || []).map((id) => genresById[id]).filter(Boolean);
  const hasTotal = series.total_progress !== null && series.total_progress !== undefined;
  const progressPct =
    hasTotal && series.total_progress > 0
      ? Math.min(100, Math.round((series.current_progress / series.total_progress) * 100))
      : null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box modal-box-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{series.title}</h3>
          <button className="btn btn-ghost btn-small" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="detail-layout">
          <div className="detail-cover">
            {series.cover_url ? (
              <img src={series.cover_url} alt={series.title} />
            ) : (
              <span className="detail-cover-initial">{series.title.charAt(0).toUpperCase()}</span>
            )}
          </div>

          <div className="detail-body">
            <div className="detail-badges">
              <span className="badge-neutral">{typeLabel(series.series_type)}</span>
              <span className="detail-status">
                <span className="status-dot" style={{ background: status.color }} />
                {status.label}
              </span>
              {series.rating != null && <span className="book-rating">★ {series.rating.toFixed(1)}</span>}
            </div>

            <div className="detail-field">
              <span className="detail-label">Progress</span>
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
            </div>

            {genres.length > 0 && (
              <div className="detail-field">
                <span className="detail-label">Genres</span>
                <div className="book-genres">
                  {genres.map((g) => (
                    <span key={g.id} className="genre-badge" style={{ "--chip-color": colorForGenre(g) }}>
                      {g.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {series.sources?.length > 0 && (
              <div className="detail-field">
                <span className="detail-label">Sources</span>
                <ul className="sources-list">
                  {series.sources.map((s, i) => (
                    <li key={i} className="sources-list-item">
                      <a href={s.url} target="_blank" rel="noreferrer">
                        {s.platform_name || s.url}
                      </a>
                      {s.is_primary && <span className="badge-primary">Primary</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {series.notes && (
              <div className="detail-field">
                <span className="detail-label">Notes</span>
                <p className="detail-notes">{series.notes}</p>
              </div>
            )}
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>
            Close
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              onClose();
              onEdit(series);
            }}
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}
