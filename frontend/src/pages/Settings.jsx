import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import ConfirmModal from "../components/ConfirmModal";
import { colorForGenre } from "../constants";
import { fetchGenres, createGenre, updateGenre, deleteGenre } from "../api/genres";

const MAX_GENRES = 200;

export default function Settings() {
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [createError, setCreateError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [banner, setBanner] = useState(null);

  async function load() {
    setLoading(true);
    const data = await fetchGenres();
    setGenres(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!banner) return;
    const t = setTimeout(() => setBanner(null), 4000);
    return () => clearTimeout(t);
  }, [banner]);

  async function handleCreate(e) {
    e.preventDefault();
    setCreateError("");
    if (!newName.trim()) return;
    try {
      await createGenre({ name: newName.trim() });
      setNewName("");
      await load();
    } catch (err) {
      setCreateError(err?.response?.data?.detail || "Couldn't create that genre.");
    }
  }

  function startEdit(genre) {
    setEditingId(genre.id);
    setEditValue(genre.name);
  }

  async function handleRename(id) {
    if (!editValue.trim()) return;
    await updateGenre(id, { name: editValue.trim() });
    setEditingId(null);
    await load();
  }

  async function handleColorChange(genre, color) {
    await updateGenre(genre.id, { color });
    await load();
  }

  async function handleDeleteConfirmed() {
    await deleteGenre(deleteTarget.id);
    setDeleteTarget(null);
    setBanner({ type: "success", text: `Deleted "${deleteTarget.name}".` });
    await load();
  }

  const atLimit = genres.length >= MAX_GENRES;

  return (
    <div className="app-shell">
      <Navbar />

      <main className="settings-page">
        <h1>Manage genres</h1>
        <p className="settings-sub">
          {genres.length} / {MAX_GENRES} genres used
        </p>

        {banner && <div className={`banner banner-${banner.type}`}>{banner.text}</div>}

        <form className="genre-create-form" onSubmit={handleCreate}>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={atLimit ? "Genre limit reached" : "New genre name"}
            disabled={atLimit}
          />
          <button type="submit" className="btn btn-primary" disabled={atLimit}>
            Add genre
          </button>
        </form>
        {createError && <div className="form-error">{createError}</div>}

        {loading ? (
          <p className="page-loading">Loading genres…</p>
        ) : (
          <ul className="genre-manage-list">
            {genres.map((g) => (
              <li key={g.id} className="genre-manage-row">
                <input
                  type="color"
                  className="genre-color-input"
                  value={g.color || colorForGenre(g)}
                  onChange={(e) => handleColorChange(g, e.target.value)}
                  title="Assign a color"
                />

                {editingId === g.id ? (
                  <>
                    <input
                      type="text"
                      className="genre-edit-input"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      autoFocus
                    />
                    <button className="btn btn-primary btn-small" onClick={() => handleRename(g.id)}>
                      Save
                    </button>
                    <button className="btn btn-ghost btn-small" onClick={() => setEditingId(null)}>
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <span className="genre-manage-name">{g.name}</span>
                    <span className="genre-usage">
                      {g.usage_count} {g.usage_count === 1 ? "series" : "series"}
                    </span>
                    <button className="btn btn-ghost btn-small" onClick={() => startEdit(g)}>
                      Rename
                    </button>
                    <button className="btn btn-danger btn-small" onClick={() => setDeleteTarget(g)}>
                      Delete
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>

      <ConfirmModal
        open={!!deleteTarget}
        title={`Delete "${deleteTarget?.name}"?`}
        message="This removes the genre from your account and from any series using it. This action cannot be undone."
        confirmLabel="Delete permanently"
        checkboxLabel="I understand, delete this genre"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirmed}
      />
    </div>
  );
}
