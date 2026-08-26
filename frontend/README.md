# Heat Triage

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


## PART 2 OF 4

```markdown
---

## Heat Risk Engine

The Flask backend combines the environmental readings and assigns a heat-health risk level.

Supported risk levels:

```text
LOW
MODERATE
HIGH
EXTREME


## PART 3 OF 4

```markdown
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


## PART 4 OF 4

```markdown
---

## Prototype Limitations

The current MVP intentionally focuses on a narrow Phoenix use case.

Current limitations include:

- neighborhood demographic values are prototype inputs
- neighborhood marker coordinates are approximate prototype locations
- the Phoenix test date/time is currently configured in the backend
- the in-memory cache is cleared when the Flask server restarts
- the current prototype is not intended to provide medical diagnosis
- production use would require authoritative demographic and public-health datasets

---

## Future Development

Potential next steps include:

- verified ACS/Census vulnerability data
- real neighborhood boundaries
- additional cities
- historical heat trends
- predictive heat alerts
- cooling-center locations and capacity
- emergency resource optimization
- heatwave simulation
- automated alerts
- SMS or WhatsApp notifications
- city-agency integrations
- persistent database-backed caching
- configurable vulnerability weights and risk thresholds

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