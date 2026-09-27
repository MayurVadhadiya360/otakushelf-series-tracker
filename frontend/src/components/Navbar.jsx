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
            <button className="btn btn-ghost btn-small" onClick={onExport}>
              Export
            </button>
            <button className="btn btn-ghost btn-small" onClick={onImportClick}>
              Import
            </button>
            <Link to="/settings" className="btn btn-ghost btn-small">
              Genres
            </Link>
            <ThemeSelector />
            <span className="navbar-username">{user.username}</span>
            <button className="btn btn-ghost btn-small" onClick={handleLogout}>
              Sign out
            </button>
          </nav>
        )}
      </div>
    </header>
  );
}
