import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import StatsStrip from "../components/StatsStrip";
import SeriesCard from "../components/SeriesCard";
import SeriesFormDrawer from "../components/SeriesFormDrawer";
import ConfirmModal from "../components/ConfirmModal";
import { SERIES_TYPES, SERIES_STATUSES, SORT_OPTIONS, colorForGenre } from "../constants";
import { fetchSeries, fetchStats, createSeries, updateSeries, deleteSeries } from "../api/series";
import { fetchGenres, createGenre } from "../api/genres";
import { exportData, importData, downloadExport } from "../api/data";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();

  const [series, setSeries] = useState([]);
  const [genres, setGenres] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [banner, setBanner] = useState(null); // { type: 'success'|'error', text }

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [genreFilter, setGenreFilter] = useState("");
  const [sort, setSort] = useState("updated_desc");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingSeries, setEditingSeries] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [importPreview, setImportPreview] = useState(null); // parsed JSON pending confirmation

  const fileInputRef = useRef(null);

  const genresById = useMemo(() => {
    const map = {};
    for (const g of genres) map[g.id] = g;
    return map;
  }, [genres]);

  const loadGenres = useCallback(async () => {
    const data = await fetchGenres();
    setGenres(data);
  }, []);

  const loadSeries = useCallback(async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const [seriesData, statsData] = await Promise.all([
        fetchSeries({
          seriesType: typeFilter,
          statusFilter,
          genreId: genreFilter,
          search,
          sort,
        }),
        fetchStats(),
      ]);
      setSeries(seriesData);
      setStats(statsData);
    } catch (err) {
      setErrorMsg("Couldn't load your shelf. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }, [typeFilter, statusFilter, genreFilter, search, sort]);

  useEffect(() => {
    loadGenres();
  }, [loadGenres]);

  useEffect(() => {
    const timeout = setTimeout(loadSeries, search ? 300 : 0);
    return () => clearTimeout(timeout);
  }, [loadSeries, search]);

  useEffect(() => {
    if (!banner) return;
    const t = setTimeout(() => setBanner(null), 5000);
    return () => clearTimeout(t);
  }, [banner]);

  function openAddDrawer() {
    setEditingSeries(null);
    setDrawerOpen(true);
  }

  function openEditDrawer(item) {
    setEditingSeries(item);
    setDrawerOpen(true);
  }

  async function handleCreateGenre(name) {
    const genre = await createGenre({ name });
    setGenres((prev) => [...prev, genre].sort((a, b) => a.name.localeCompare(b.name)));
    return genre;
  }

  async function handleSubmit(payload) {
    if (editingSeries) {
      await updateSeries(editingSeries.id, payload);
    } else {
      await createSeries(payload);
    }
    setDrawerOpen(false);
    await Promise.all([loadSeries(), loadGenres()]);
  }

  async function handleDeleteConfirmed() {
    await deleteSeries(deleteTarget.id);
    setDeleteTarget(null);
    await loadSeries();
  }

  async function handleExport() {
    try {
      const data = await exportData();
      downloadExport(data, user.username);
      setBanner({ type: "success", text: "Your data was exported." });
    } catch (err) {
      setBanner({ type: "error", text: "Export failed. Try again." });
    }
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  function handleFileSelected(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!Array.isArray(parsed.series)) {
          throw new Error("Missing series list");
        }
        setImportPreview(parsed);
      } catch (err) {
        setBanner({ type: "error", text: "That doesn't look like a valid OtakuShelf export file." });
      }
    };
    reader.readAsText(file);
  }

  async function handleImportConfirmed() {
    const result = await importData(importPreview);
    setImportPreview(null);
    setBanner({
      type: "success",
      text: `Imported ${result.imported} series (${result.skipped} skipped as duplicates, ${result.genres_created} new genres created).`,
    });
    await Promise.all([loadSeries(), loadGenres()]);
  }

  const emptyStateCopy = useMemo(() => {
    if (search || typeFilter || statusFilter || genreFilter) {
      return "Nothing matches these filters yet.";
    }
    return "Your shelf is empty. Add the first thing you're reading or watching.";
  }, [search, typeFilter, statusFilter, genreFilter]);

  return (
    <div className="app-shell">
      <Navbar onExport={handleExport} onImportClick={handleImportClick} />
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        className="visually-hidden"
        onChange={handleFileSelected}
      />

      <main className="dashboard">
        {banner && <div className={`banner banner-${banner.type}`}>{banner.text}</div>}

        <StatsStrip stats={stats} />

        <div className="toolbar">
          <input
            type="search"
            className="search-input"
            placeholder="Search your shelf…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="chip-group" role="group" aria-label="Filter by type">
            <button
              className={`chip ${typeFilter === "" ? "chip-active" : ""}`}
              onClick={() => setTypeFilter("")}
            >
              All types
            </button>
            {SERIES_TYPES.map((t) => (
              <button
                key={t.value}
                className={`chip ${typeFilter === t.value ? "chip-active" : ""}`}
                onClick={() => setTypeFilter(typeFilter === t.value ? "" : t.value)}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="chip-group" role="group" aria-label="Filter by status">
            <button
              className={`chip ${statusFilter === "" ? "chip-active" : ""}`}
              onClick={() => setStatusFilter("")}
            >
              All statuses
            </button>
            {SERIES_STATUSES.map((s) => (
              <button
                key={s.value}
                className={`chip ${statusFilter === s.value ? "chip-active" : ""}`}
                onClick={() => setStatusFilter(statusFilter === s.value ? "" : s.value)}
              >
                {s.label}
              </button>
            ))}
          </div>

          {genres.length > 0 && (
            <div className="chip-group" role="group" aria-label="Filter by genre">
              <button
                className={`chip ${genreFilter === "" ? "chip-active" : ""}`}
                onClick={() => setGenreFilter("")}
              >
                All genres
              </button>
              {genres.map((g) => (
                <button
                  key={g.id}
                  className={`chip ${genreFilter === g.id ? "chip-active" : ""}`}
                  style={genreFilter === g.id ? { background: colorForGenre(g), borderColor: colorForGenre(g) } : undefined}
                  onClick={() => setGenreFilter(genreFilter === g.id ? "" : g.id)}
                >
                  {g.name}
                </button>
              ))}
            </div>
          )}

          <div className="toolbar-right">
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="sort-select">
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <button className="btn btn-primary" onClick={openAddDrawer}>
              + Add series
            </button>
          </div>
        </div>

        {errorMsg && <div className="form-error">{errorMsg}</div>}

        {loading ? (
          <div className="page-loading">Loading your shelf…</div>
        ) : series.length === 0 ? (
          <div className="empty-state">
            <p>{emptyStateCopy}</p>
            {!search && !typeFilter && !statusFilter && !genreFilter && (
              <button className="btn btn-primary" onClick={openAddDrawer}>
                + Add your first series
              </button>
            )}
          </div>
        ) : (
          <div className="book-shelf-grid">
            {series.map((item) => (
              <SeriesCard
                key={item.id}
                series={item}
                genresById={genresById}
                onEdit={openEditDrawer}
                onDeleteRequest={setDeleteTarget}
              />
            ))}
          </div>
        )}
      </main>

      <SeriesFormDrawer
        open={drawerOpen}
        initialValue={editingSeries}
        allGenres={genres}
        onCreateGenre={handleCreateGenre}
        onClose={() => setDrawerOpen(false)}
        onSubmit={handleSubmit}
      />

      <ConfirmModal
        open={!!deleteTarget}
        title={`Delete "${deleteTarget?.title}"?`}
        message="This will permanently remove it from your shelf. This action cannot be undone."
        confirmLabel="Delete permanently"
        checkboxLabel="I understand, delete this series"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirmed}
      />

      <ConfirmModal
        open={!!importPreview}
        danger={false}
        title="Import this data?"
        message={
          importPreview
            ? `This file contains ${importPreview.series.length} series and ${importPreview.genres?.length ?? 0} genres. Series with a title + type that already exists on your shelf will be skipped.`
            : ""
        }
        confirmLabel="Import"
        checkboxLabel="I understand, import this file"
        onCancel={() => setImportPreview(null)}
        onConfirm={handleImportConfirmed}
      />
    </div>
  );
}
