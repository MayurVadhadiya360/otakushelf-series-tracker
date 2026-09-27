/**
 * props:
 *  - sources: [{ platform_name, url, is_primary }]
 *  - onChange: (nextSources) => void
 */
export default function SourcesInput({ sources, onChange }) {
  function updateSource(index, field, value) {
    onChange(sources.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  }

  function addSource() {
    onChange([
      ...sources,
      { platform_name: "", url: "", is_primary: sources.length === 0 },
    ]);
  }

  function removeSource(index) {
    const next = sources.filter((_, i) => i !== index);
    if (next.length && !next.some((s) => s.is_primary)) {
      next[0] = { ...next[0], is_primary: true };
    }
    onChange(next);
  }

  function setPrimary(index) {
    onChange(sources.map((s, i) => ({ ...s, is_primary: i === index })));
  }

  return (
    <div className="sources-input">
      {sources.map((s, i) => (
        <div className="source-row" key={i}>
          <input
            type="text"
            className="source-platform"
            placeholder="Platform (optional)"
            value={s.platform_name || ""}
            onChange={(e) => updateSource(i, "platform_name", e.target.value)}
          />
          <input
            type="text"
            className="source-url"
            placeholder="https://…"
            value={s.url || ""}
            onChange={(e) => updateSource(i, "url", e.target.value)}
          />
          <label className="source-primary-toggle" title="Set as primary source">
            <input
              type="radio"
              name="primary-source"
              checked={!!s.is_primary}
              onChange={() => setPrimary(i)}
            />
            Primary
          </label>
          <button
            type="button"
            className="source-remove"
            onClick={() => removeSource(i)}
            aria-label="Remove source"
          >
            ✕
          </button>
        </div>
      ))}

      <button type="button" className="btn btn-ghost btn-small" onClick={addSource}>
        + Add source
      </button>
    </div>
  );
}
