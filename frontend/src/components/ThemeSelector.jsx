import { useEffect, useRef, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { THEMES } from "../constants";

export default function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const current = THEMES.find((t) => t.value === theme) || THEMES[0];

  return (
    <div className="theme-selector" ref={ref}>
      <button
        type="button"
        className="theme-selector-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="theme-swatch" style={{ background: current.swatch }} />
        <span className="theme-selector-label">{current.label}</span>
        <span className="theme-selector-caret">▾</span>
      </button>

      {open && (
        <div className="theme-dropdown" role="listbox">
          {THEMES.map((t) => (
            <button
              type="button"
              key={t.value}
              role="option"
              aria-selected={t.value === theme}
              className={`theme-option ${t.value === theme ? "theme-option-active" : ""}`}
              onClick={() => {
                setTheme(t.value);
                setOpen(false);
              }}
            >
              <span className="theme-swatch" style={{ background: t.swatch }} />
              {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
