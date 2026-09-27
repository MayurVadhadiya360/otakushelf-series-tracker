# OtakuShelf — Series Tracker

Track everything you're reading and watching — novels, manga, manhua,
manhwa, anime, donghua, and more — on one private, authenticated shelf.

- **Backend:** FastAPI + PyMongo (MongoDB — local container for dev, Atlas or any MongoDB for production), JWT authentication
- **Frontend:** React (Vite), 6 selectable themes, book-spine style cards

## Features

- Register / log in with a JWT-secured session
- Add, edit, delete series with type, status, progress, rating, notes, and a cover image (shown uncropped)
- **Multiple alternate sources** per series (e.g. Crunchyroll + Netflix), shown via a "Sources" button + modal
- **User-defined genres** — every account starts with ~40 standard genres; create new ones on the fly while adding a series, or manage them (rename, recolor, delete) from Settings
- Filter by type, status, and genre; search by title; sort by recency/title/rating
- **6 themes** (Indigo, Cool, Warm — each in dark and light) switchable instantly from the navbar, saved to your account
- Custom themed confirmation modal for deletions (no browser `confirm()`), with a required checkbox as an extra safety step
- **Export/Import** your whole shelf as JSON
- Configuration and logs live in a mounted `app_data/` volume, so they survive container restarts

## Project structure

```
otakushelf/
├── backend/
│   ├── app/
│   │   ├── main.py            FastAPI app, CORS, startup, SPA static serving
│   │   ├── config.py          Loads app_data/config.json (env-var fallback)
│   │   ├── logging_config.py  Rotating file + console logging
│   │   ├── database.py        PyMongo connection + indexes
│   │   ├── security.py        JWT + bcrypt
│   │   ├── deps.py            FastAPI dependencies (DB session, current user)
│   │   ├── schemas.py         Pydantic request/response models
│   │   ├── serializers.py     Mongo doc → API dict conversion
│   │   ├── default_genres.py  Standard genre list seeded at sign-up
│   │   ├── repositories/      PyMongo data access (user, series, genre)
│   │   └── routers/           auth, users, genres, series, data (export/import)
│   ├── requirements.txt
│   ├── Dockerfile             Dev image (hot-reload)
│   └── config.json.example    Template — copy into app_data/config.json
│
├── frontend/
│   ├── src/
│   │   ├── api/                Axios calls (auth, users, genres, series, data)
│   │   ├── context/             AuthContext, ThemeContext
│   │   ├── components/          Navbar, ThemeSelector, SeriesCard (book-spine),
│   │   │                        SeriesFormDrawer, GenreInput, SourcesInput/Modal,
│   │   │                        ConfirmModal, StatsStrip, AuthLayout, PrivateRoute
│   │   ├── pages/                Login, Register, Dashboard, Settings
│   │   └── styles/index.css      6-theme CSS variable system
│   ├── package.json
│   └── vite.config.js
│
├── app_data/                    Mounted volume — config + logs (gitignore your real one)
│   ├── config.json              Ready to go for local dev (points at the `database` container)
│   ├── config.json.example      Template for production / Atlas
│   └── logs/
│
├── docker-compose.yml            Development: local MongoDB + hot-reload backend + Vite frontend
├── docker-compose.prod.yml       Production (single container, bring your own MongoDB URI)
├── Dockerfile.prod               Multi-stage: builds React, then serves it via FastAPI
└── README.md
```

## 1. Run it — development

A `database` service (MongoDB 7, with a persistent named volume) is already wired up in
`docker-compose.yml`, and `app_data/config.json` is pre-configured to use it — so for local
development there's nothing to set up:

```bash
docker compose up --build
```

- Frontend (Vite, hot-reload): **http://localhost:5173**
- Backend API + docs: **http://localhost:8000/docs**
- MongoDB: **localhost:27017** (reachable from the host too, e.g. with MongoDB Compass)

Data lives in the `otakushelf-mongo-data` named volume, so it survives `docker compose down`
and restarts — only `docker compose down -v` removes it. Config and logs live in `app_data/`
the same way.

## 2. Switch to MongoDB Atlas (or any remote MongoDB)

The local `database` container is for development convenience. To point at Atlas — for
production, or if you'd rather not run Mongo locally at all — only `app_data/config.json`
needs to change; nothing in the codebase does, since PyMongo handles `mongodb://` and
`mongodb+srv://` connection strings the same way.

1. Create a free account at [mongodb.com/atlas](https://www.mongodb.com/atlas) and a free (M0) cluster
2. Under **Database Access**, create a database user with a password
3. Under **Network Access**, allow your IP (or `0.0.0.0/0` for simplicity during development)
4. Click **Connect → Drivers** and copy the connection string
5. Edit `app_data/config.json`:

```json
{
  "mongodb": {
    "connection_string": "mongodb+srv://youruser:yourpass@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority",
    "database_name": "otakushelf"
  },
  "app": {
    "secret_key": "<run: python3 -c \"import secrets; print(secrets.token_hex(32))\">",
    "access_token_expire_minutes": 1440,
    "debug": false,
    "cors_origins": ["http://localhost:5173", "http://localhost:8000"]
  },
  "logging": {
    "level": "INFO",
    "log_dir": "/app/app_data/logs"
  }
}
```

6. If you're not using the local `database` container anymore, either remove that service
   from `docker-compose.yml` or just leave it running unused — the backend only talks to
   whatever `connection_string` points at.

Once you're pointing at real credentials, treat `app_data/config.json` like a secret: it's
already listed in `.gitignore` so it won't get committed. Also replace `secret_key` with a
real random value for anything beyond local testing — generate one with
`python3 -c "import secrets; print(secrets.token_hex(32))"`.

## 3. Run it — production (single container)

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

This builds the React app with `npm run build` and copies the result into the FastAPI image, so **one container on one port** serves everything:

- App: **http://localhost:8000**
- API docs: **http://localhost:8000/docs**

Set `APP_PORT` in your shell or a `.env` file to change the exposed port.

## Running without Docker (optional)

**Backend:**
```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
export CONFIG_PATH=$(pwd)/../app_data/config.json
uvicorn app.main:app --reload --port 8000
```
(Or skip `config.json` entirely and set `MONGODB_URL`, `SECRET_KEY`, etc. as environment variables — `config.py` falls back to these if no file is found.)

Note: `app_data/config.json`'s default `mongodb://database:27017/` only resolves inside the
Docker Compose network. Running the backend directly on your host, either start the compose
`database` container on its own (`docker compose up database`) and change the host in the
connection string to `localhost`, run your own local MongoDB, or point at Atlas instead.

**Frontend:**
```bash
cd frontend
npm install
cp .env.example .env   # VITE_API_URL=http://localhost:8000
npm run dev
```

## Configuration reference (`app_data/config.json`)

| Key | Description |
|---|---|
| `mongodb.connection_string` | MongoDB connection URI. Defaults to the local `database` container (`mongodb://database:27017/`); swap in an Atlas or other remote URI any time |
| `mongodb.database_name` | Database name to use (default `otakushelf`) |
| `app.secret_key` | Random secret used to sign JWTs — **generate a real one for production** |
| `app.access_token_expire_minutes` | How long a login session lasts |
| `app.cors_origins` | Origins allowed to call the API |
| `logging.level` | `DEBUG`, `INFO`, `WARNING`, or `ERROR` |
| `logging.log_dir` | Where rotating log files are written (inside the container; mount this as a volume) |

## Logs

Logs are written to `app_data/logs/app.log` (rotating, 10MB × 5 backups) and also to stdout, so:

```bash
docker compose logs -f backend       # live, dev
docker compose -f docker-compose.prod.yml logs -f app   # live, prod
cat app_data/logs/app.log            # from the host, any time
```

## API overview

| Method | Path | Description | Auth |
|---|---|---|---|
| POST | `/api/auth/register` | Create an account (seeds ~40 default genres) | — |
| POST | `/api/auth/login` | Get a JWT access token | — |
| GET | `/api/auth/me` | Current user's profile | ✅ |
| PUT | `/api/users/me/theme` | Update theme preference | ✅ |
| GET | `/api/genres` | List your genres | ✅ |
| POST | `/api/genres` | Create a genre | ✅ |
| PUT | `/api/genres/{id}` | Rename / recolor a genre | ✅ |
| DELETE | `/api/genres/{id}` | Delete a genre (removed from all series too) | ✅ |
| GET | `/api/series` | List series (filter by type/status/genre, search, sort) | ✅ |
| POST | `/api/series` | Add a series (with genres + sources) | ✅ |
| GET | `/api/series/stats` | Counts by status/type | ✅ |
| GET/PUT/DELETE | `/api/series/{id}` | Get / update / delete one series | ✅ |
| GET | `/api/export` | Download all data as JSON | ✅ |
| POST | `/api/import` | Import a JSON export (skips duplicate titles) | ✅ |

Series `series_type`: `novel`, `manga`, `manhua`, `manhwa`, `anime`, `donghua`, `other`.
Series `status`: `planning`, `in_progress`, `completed`, `on_hold`, `dropped`.
Theme values: `indigo_dark`, `indigo_light`, `cool_dark`, `cool_light`, `warm_dark`, `warm_light`.

## Notes

- **Genre limit:** 200 genres per account (enforced server-side).
- **Deleting a genre** removes it from every series that used it — no orphaned references left behind.
- **Import** matches existing series by title + type (case-insensitive) and skips duplicates rather than overwriting.
