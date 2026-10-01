import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ThemeSelector from "./ThemeSelector";

export default function Navbar({ onExport, onImportClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() {
    setMenuOpen(false);
    logout();
    navigate("/login");
  }

  function handleExport() {
    setMenuOpen(false);
    onExport();
  }

  function handleImportClick() {
    setMenuOpen(false);
    onImportClick();
  }

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="wordmark">
          OtakuShelf
        </Link>

        {user && (
          <>
            {/* Hamburger toggle — hidden on desktop via CSS, only relevant
                below the mobile breakpoint where the actions row would
                otherwise wrap across 2-3 stacked rows and push content down. */}
            <button
              type="button"
              className="navbar-toggle"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
            >
              {menuOpen ? "✕" : "☰"}
            </button>

            <nav className={`navbar-actions ${menuOpen ? "navbar-actions-open" : ""}`}>
              <div className="navbar-group">
                <button className="navbar-group-btn" onClick={handleExport}>
                  Export
                </button>
                <span className="navbar-group-divider" />
                <button className="navbar-group-btn" onClick={handleImportClick}>
                  Import
                </button>
                <span className="navbar-group-divider" />
                <Link
                  to="/settings"
                  className="navbar-group-btn navbar-group-link"
                  onClick={() => setMenuOpen(false)}
                >
                  Genres
                </Link>
              </div>

              <ThemeSelector />

              <span className="navbar-divider" />

              <div className="navbar-user">
                <span className="navbar-avatar">{user.username.charAt(0).toUpperCase()}</span>
                <span className="navbar-username">{user.username}</span>
                <button className="btn btn-ghost" onClick={handleLogout}>
                  Sign out
                </button>
              </div>
            </nav>
          </>
        )}
      </div>
    </header>
  );
}
