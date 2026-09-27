import { useLayoutEffect, useRef, useState } from "react";
import { colorForGenre } from "../constants";

// Must match the collapsed height reserved in CSS (.genre-filter-wrapper.collapsed).
const COLLAPSED_MAX_HEIGHT = 124;

export default function GenreFilterChips({ genres, activeId, onSelect }) {
  const innerRef = useRef(null);
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);

  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return;

    // scrollHeight reflects the element's own natural content height
    // regardless of whether an ancestor wrapper is currently clipping it,
    // so this works whether we're collapsed or expanded right now.
    const measure = () => setOverflowing(el.scrollHeight > COLLAPSED_MAX_HEIGHT + 4);

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [genres]);

  if (genres.length === 0) return null;

  return (
    <div className="genre-filter">
      <div
        className={`genre-filter-wrapper ${!expanded && overflowing ? "collapsed" : ""}`}
      >
        <div className="chip-group" ref={innerRef} role="group" aria-label="Filter by genre">
          <button
            type="button"
            className={`chip ${activeId === "" ? "chip-active" : ""}`}
            onClick={() => onSelect("")}
          >
            All genres
          </button>
          {genres.map((g) => (
            <button
              type="button"
              key={g.id}
              className={`chip ${activeId === g.id ? "chip-active" : ""}`}
              style={activeId === g.id ? { background: colorForGenre(g), borderColor: colorForGenre(g) } : undefined}
              onClick={() => onSelect(activeId === g.id ? "" : g.id)}
            >
              {g.name}
            </button>
          ))}
        </div>
      </div>

      {overflowing && (
        <div className="genre-filter-toggle-row">
          <button type="button" className="genre-filter-toggle" onClick={() => setExpanded((e) => !e)}>
            {expanded ? "Show less ▲" : "Show all genres ▾"}
          </button>
        </div>
      )}
    </div>
  );
}
