# CLIMASCOPE

CLIMASCOPE is an AI evidence-sufficiency workbench for climate decisions. It audits
whether the evidence supports a proposed action, keeps forecast disagreement visible,
and identifies evidence gaps. A forecast is not automatically a safe decision.

> **Do not use this prototype for operational or life-safety decisions.** Live public
> feeds may be unavailable, delayed, incomplete, or unsuitable for a local decision.
> All seeded validation cases, sample history records, and fallback model values are
> explicitly labeled simulated/illustrative.

## How it works

```text
Decision + location
       |
       v
Evidence ingestion --> Five-dimension audit --> Model spread + uncertainty
                                                      |
                                                      v
                           Explanation + ranked next evidence + verdict
```

The score is calculated as:

```text
Sufficiency = (Evidence Quality × Model Agreement × Decision Relevance)
              ÷ Consequence of Error
```

Audit dimensions, score weights, consequence multipliers, and verdict thresholds are
configured in `backend/app/config.py` and `src/config/engine.ts`. The verdict and its
formula inputs are returned together; source removal runs through the same `/what-if`
contract in mock and API modes.

## Technology and layout

- Frontend: React, TypeScript, Vite, Tailwind, Recharts, Leaflet, Zustand, React Router.
- Backend: FastAPI, Pydantic 2, SQLAlchemy 2, Alembic, SQLite for local development,
  PostgreSQL/PostGIS in Docker Compose.
- Public connectors: Open-Meteo, NASA POWER, and OpenStreetMap/Overpass. No paid API
  keys are needed.
- `src/mocks/` provides visibly simulated, typed frontend fixtures.
- `src/api/` defines the frontend API contract and mock/live switch.
- `backend/app/services/` implements ingestion, audit, consensus, scoring,
  recommendations, explanations, and validation.
- `backend/app/db/` defines SQLAlchemy models and seeds the demo catalogs.
- `backend/alembic/` contains database migrations.

## Run locally (mock frontend)

Requirements: Node.js 22+ and npm.

```powershell
npm install
npm run dev
```

Open `http://localhost:5173`. Mock mode is the default and is identified in the UI.
No backend or network connection is needed for mock screens; the map tiles and
OpenStreetMap search do require internet access.

Build the frontend:

```powershell
npm run build
```

## Run the integrated app locally

Requirements: Python 3.11+ and the dependencies in `backend/requirements.txt`.

Terminal 1 — install and start the API:

```powershell
cd backend
python -m pip install -r requirements.txt
python run.py
```

The API initializes `backend/climascope.db` (SQLite) and seeds historical and demo
comparison records on first startup. API docs are at `http://127.0.0.1:8000/docs`;
health is at `http://127.0.0.1:8000/health`.

Terminal 2 — from the project root, create `.env` with:

```dotenv
VITE_USE_MOCKS=false
VITE_API_BASE_URL=/api/v1
```

Then run:

```powershell
npm run dev
```

Vite proxies `/api` requests to `http://127.0.0.1:8000`. Restart Vite after
changing `.env`. Remove the project-root `.env` or set `VITE_USE_MOCKS=true` to
return to simulated frontend responses. Do not commit local `.env` files.

## Run with PostgreSQL + PostGIS (Docker)

Requirements: Docker Desktop with Compose.

```powershell
docker compose up --build
```

Open `http://localhost:8080` for the app, `http://localhost:8000/docs` for the
FastAPI docs, and `http://localhost:8000/health` for health. The compose stack
waits for PostGIS to become healthy, applies Alembic migrations, initializes seed
data, and persists database files in the `postgres_data` named volume.

The default compose password is only for local development. Set
`POSTGRES_PASSWORD` in a local root `.env` before using the stack on a shared
machine. The `db` service is not published to the host.

To stop the stack without deleting seeded or user data:

```powershell
docker compose down
```

To intentionally erase the local database volume and all its records:

```powershell
docker compose down --volumes
```

## Seeded data and source status

- Six historical event rows are inserted into `historical_cases` for the validation
  screen. Their verdict correctness labels and preset ablation rows are **simulated
  demo data**, not an independently validated replay; the dashboard says so.
- Three comparison records are inserted into `decision_audits` with
  `record_kind=seed-demo`. They are labeled as demo records, not as live audits.
- Each analysis attempts to fetch public data. If a connector is unavailable, the
  affected source is labeled `[SIMULATED / UNVERIFIED]` and its audit values are
  discounted. The consensus fallback is also labeled and uses illustrative values.
- Open-Meteo multi-model output is used only when at least two model-separated
  outputs are returned. Otherwise the API falls back to a clearly marked
  demonstration ensemble. Calibration is reported unavailable rather than
  fabricated.
- The satellite and official-report cards are placeholders marked unavailable; no
  Sentinel/Landsat imagery or government reports are claimed to have been queried.
- The OpenStreetMap source queries waterways and hospitals in a bounded area.
  Its mapped features are not treated as flood observations.

The frontend and backend tunables are separately configured today. Keep their
values synchronized if thresholds or weights are changed. This prototype does not
provide authentication, authorization, operational calibration, or a scientific
ground-truth corpus.

## API contract (Phase 1 frontend / Phase 2 backend)

Base path: `/api/v1`. Pydantic OpenAPI schemas are browsable at `/docs`.

| Method | Path | Body | Response |
|---|---|---|---|
| POST | `/evidence` | `{ decision, enabledSourceIds? }` | Evidence sources and aggregate quality |
| POST | `/consensus` | `{ decision }` | Model outputs, agreement, spread, calibration status |
| POST | `/verdict` | `{ decision, enabledSourceIds? }` | Verdict, breakdown, thresholds; persists an audit |
| POST | `/missing-evidence` | `{ decision, enabledSourceIds? }` | Ranked candidate additions and estimated score changes |
| POST | `/what-if` | `{ decision, enabledSourceIds }` | Recomputed evidence, consensus, verdict, recommendations |
| GET | `/validation` | — | Seeded cases, demo ablation results, dataset note |
| GET | `/history` | — | Seeded and user-run decision records |
| GET | `/history/{id}` | — | One stored decision record |

The frontend sends camelCase JSON as defined in `src/api/types.ts`. FastAPI
validates requests; errors return a non-success status and a readable error detail.

## Tests

```powershell
python -m pytest backend/tests -q
npm run build
```

Tests cover audit weights, consensus uncertainty, verdict formula/thresholds,
recommendation ranking, API response shapes, history, and a verdict change when
evidence is removed.
