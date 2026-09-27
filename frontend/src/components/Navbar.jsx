import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ThemeSelector from "./ThemeSelector";

export default function Navbar({ onExport, onImportClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="wordmark">
          OtakuShelf
        </Link>

        {user && (
          <nav className="navbar-actions">
            <div className="navbar-group">
              <button className="navbar-group-btn" onClick={onExport}>
                Export
              </button>
              <span className="navbar-group-divider" />
              <button className="navbar-group-btn" onClick={onImportClick}>
                Import
              </button>
              <span className="navbar-group-divider" />
              <Link to="/settings" className="navbar-group-btn navbar-group-link">
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
        )}
      </div>
    </header>
  );
}
