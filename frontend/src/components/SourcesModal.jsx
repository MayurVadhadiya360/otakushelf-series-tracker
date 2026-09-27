import useBodyScrollLock from "../hooks/useBodyScrollLock";

export default function SourcesModal({ open, title, sources, onClose }) {
  useBodyScrollLock(open);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Sources for {title}</h3>
          <button className="btn btn-ghost btn-small" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <ul className="sources-list">
          {sources.map((s, i) => (
            <li key={i} className="sources-list-item">
              <a href={s.url} target="_blank" rel="noreferrer">
                {s.platform_name || s.url}
              </a>
              {s.is_primary && <span className="badge-primary">Primary</span>}
            </li>
          ))}
        </ul>

        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
