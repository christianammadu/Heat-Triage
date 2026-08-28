# Heat Triage (Note: Backend may need a short wake-up on first access.)

**Heat Triage** is a heat-health decision-support dashboard designed to help cities understand extreme-heat conditions and identify where intervention should be prioritized first.

The current prototype focuses on **Phoenix, Arizona** and combines real heat and environmental intelligence from the **FortyGuard API** with a prototype neighborhood vulnerability layer.

The core question Heat Triage answers is:

> **How dangerous are current heat conditions, why are they dangerous, and where should city teams act first?**

---

## Problem

Extreme heat does not affect every community equally.

Traditional temperature maps can show where it is hot, but emergency planners still need to answer questions such as:

- How dangerous are the current conditions?
- What environmental factors are contributing to the risk?
- Which communities should receive intervention first?
- What action should city teams take?

Heat Triage converts heat and environmental data into an explainable, action-oriented risk view.

---

## Solution

Heat Triage combines:

- temperature data
- heat index
- apparent temperature
- wet-bulb temperature
- humidity
- air quality
- neighborhood heat exposure
- prototype social-vulnerability indicators

The system then produces:

- a heat-health risk score
- LOW / MODERATE / HIGH / EXTREME risk classification
- an explanation of why the risk level was assigned
- recommended safety action
- ranked neighborhood intervention priorities
- an interactive Phoenix priority map
- data-source activity IDs for traceability

---

## Current Prototype

The current prototype monitors Phoenix, Arizona.

Example output from the current demo:

- Heat Risk Level: **HIGH**
- Heat Risk Score: **61 / 100**
- Mean Temperature: approximately **39.7°C**
- Heat Index: approximately **39.2°C**
- Apparent Temperature: approximately **41.0°C**

The system explains the reasons behind the classification instead of showing only a score.

---

## Who Should We Help First?

Heat Triage includes a prototype neighborhood prioritization layer.

Each neighborhood receives a priority score based on:

- **50% heat exposure**
- **30% poverty vulnerability**
- **20% elderly-population vulnerability**

The current formula is:

```text
Priority Score =
(Heat Exposure × 0.50)
+
(Poverty Vulnerability × 0.30)
+
(Elderly Vulnerability × 0.20)
````

The neighborhoods are then ranked from highest to lowest intervention priority.

The prototype currently includes:

* Maryvale
* East Phoenix
* Laveen Village
* Downtown Phoenix
* Arcadia

The highest-ranked neighborhood is highlighted as the **Top Intervention Priority** and receives a recommended city response.

> Important: neighborhood demographic values in the current prototype are demonstration inputs and should not be interpreted as verified Census statistics.

---

## FortyGuard Integration

Heat Triage uses the FortyGuard SDK/API for real heat and environmental intelligence.

The backend currently uses FortyGuard for:

### Heatmap Generation

The backend sends a Phoenix polygon to FortyGuard and retrieves temperature statistics including:

* mean temperature
* maximum temperature
* minimum temperature
* activity ID

### Environmental Parameters

The application also retrieves environmental indicators including:

* heat index
* apparent temperature
* relative humidity
* wet-bulb temperature
* air-quality index

The frontend displays the returned activity IDs as part of the **Data Trace** section.

---

## Heat Risk Engine

The Flask backend combines the environmental readings and assigns a heat-health risk level.

Supported risk levels:

```text
LOW
MODERATE
HIGH
EXTREME
```

The response also includes:

* priority level
* numerical score
* explanation
* recommended action
* reasons that triggered the classification

This makes the result explainable rather than operating as a black-box score.

---

## Live Data and Caching

FortyGuard processing can take time because heatmap and environmental jobs may need to complete before results are available.

Heat Triage therefore includes a lightweight cache.

A successful triage result is cached for:

```text
5 minutes
```

The dashboard clearly displays whether the current result is:

```text
LIVE DATA
```

or:

```text
CACHED DATA
```

Cached results also display human-readable freshness information such as:

```text
Cached 2 minutes ago
```

Users can select **Refresh Data** to request a fresh FortyGuard result.

If a fresh request takes too long or fails, the application attempts to display the most recent available result instead.

---

## Phoenix Heat Priority Map

The application contains an interactive Phoenix map built with:

* React Leaflet
* Leaflet
* OpenStreetMap

Neighborhood markers are displayed according to intervention priority.

Users can click a marker to view:

* neighborhood
* ZIP
* priority score
* priority level
* heat exposure
* poverty vulnerability
* age 65+ vulnerability

The highest-priority neighborhood receives a larger highlighted marker.

---

## Recommended City Actions

Heat Triage turns risk intelligence into operational recommendations.

Example recommendations include:

* prioritize cooling-center access
* distribute hydration resources
* conduct community outreach
* perform welfare checks for vulnerable residents
* communicate heat-safety guidance
* reduce strenuous outdoor activity
* use shaded or cooled spaces

---

## Architecture

```text
             FortyGuard API
                  |
                  v
          Python / Flask API
                  |
          -------------------
          |                 |
          v                 v
    Heatmap Data     Environmental Data
          |                 |
          -------     -------
                 \   /
                  v
          Heat Triage Engine
                  |
                  v
          Cache / Safe Fallback
                  |
                  v
            React Frontend
                  |
       -------------------------
       |           |           |
       v           v           v
  Risk Score   Priority Map  City Actions
```

---

## Technology Stack

### Frontend

* React
* Vite
* JavaScript
* CSS
* React Leaflet
* Leaflet
* OpenStreetMap

### Backend

* Python
* Flask
* Flask-CORS
* FortyGuard SDK
* python-dotenv

### Development

* Visual Studio Code
* Git
* GitHub

---

## Project Structure

```text
Heat-Triage/
│
├── backend/
│   ├── fortyguard/
│   ├── .env
│   └── app.py
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── PhoenixHeatMap.jsx
│   │   │
│   │   ├── data/
│   │   │   └── neighborhoods.js
│   │   │
│   │   ├── App.jsx
│   │   └── App.css
│   │
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## Backend API Endpoints

### API Status

```text
GET /
```

Checks whether the Heat Triage backend is running.

### Heat Data

```text
GET /api/heat
```

Requests FortyGuard heatmap data for the Phoenix test area.

### Environmental Data

```text
GET /api/environment
```

Requests environmental parameters from FortyGuard.

### Combined Heat Triage

```text
GET /api/triage
```

Returns the combined heat-health assessment.

### Force Fresh Data

```text
GET /api/triage?refresh=1
```

Bypasses the normal cache and requests a new FortyGuard result.

---

## Running the Project Locally

### 1. Clone the Repository

```bash
git clone https://github.com/christianammadu/Heat-Triage.git
cd Heat-Triage
```

### 2. Backend Setup

Move into the backend:

```bash
cd backend
```

Create and activate a Python virtual environment.

Install the required Python dependencies.

Create:

```text
backend/.env
```

Add the required FortyGuard credentials.

Never commit real API keys to GitHub.

Start the backend:

```bash
python app.py
```

The backend should run at:

```text
http://127.0.0.1:5000
```

### 3. Frontend Setup

Open another terminal and move into the frontend:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start Vite:

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

---

## Security

Secrets are stored using environment variables.

The repository `.gitignore` excludes:

```text
.env
venv
__pycache__
*.pyc
```

Real API credentials should never be committed to GitHub.

---

## Prototype Limitations

The current MVP intentionally focuses on a narrow Phoenix use case.

Current limitations include:

* neighborhood demographic values are prototype inputs
* neighborhood marker coordinates are approximate prototype locations
* the Phoenix test date/time is currently configured in the backend
* the in-memory cache is cleared when the Flask server restarts
* the current prototype is not intended to provide medical diagnosis
* production use would require authoritative demographic and public-health datasets

---

## Future Development

Potential next steps include:

* verified ACS/Census vulnerability data
* real neighborhood boundaries
* additional cities
* historical heat trends
* predictive heat alerts
* cooling-center locations and capacity
* emergency resource optimization
* heatwave simulation
* automated alerts
* SMS or WhatsApp notifications
* city-agency integrations
* persistent database-backed caching
* configurable vulnerability weights and risk thresholds

---

## Why Heat Triage?

A normal heat dashboard may answer:

> **Where is it hot?**

Heat Triage is designed to answer:

> **How dangerous is it?**

> **Why is it dangerous?**

> **Who should we help first?**

> **What should we do next?**

---

## Built With FortyGuard

Heat Triage uses FortyGuard temperature and environmental intelligence as the core real-world heat-data layer of the project.

The goal is to transform raw environmental intelligence into practical, explainable decisions for extreme-heat response.

```
