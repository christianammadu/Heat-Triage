import { useEffect, useState } from "react";
import "./App.css";
import { neighborhoods } from "./data/neighborhoods";
import PhoenixHeatMap from "./components/PhoenixHeatMap";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000";

function App() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("");
  const [refreshMessage, setRefreshMessage] = useState("");
  const [refreshWarning, setRefreshWarning] = useState("");
  const [showPriorityAlert, setShowPriorityAlert] = useState(true);

  const fetchWithTimeout = async (url, timeoutMs = 90000) => {
    const controller = new AbortController();

    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
      });

      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  };

  const fetchCachedData = async () => {
    const response = await fetch(
      `${API_BASE_URL}/api/triage`
    );

    if (!response.ok) {
      throw new Error(
        "Could not load the most recent Heat Triage data."
      );
    }

    return response.json();
  };

  const fetchTriageData = async (forceRefresh = false) => {
    setError("");
    setRefreshMessage("");
    setRefreshWarning("");
    setLoading(true);

    try {
      if (!forceRefresh) {
        const result = await fetchCachedData();

        setData(result);
        setLastUpdated(new Date().toLocaleTimeString());
        return;
      }

      try {
        const response = await fetchWithTimeout(
          `${API_BASE_URL}/api/triage?refresh=1`,
          90000
        );

        if (!response.ok) {
          throw new Error("Fresh FortyGuard update failed.");
        }

        const result = await response.json();

        setData(result);
        setLastUpdated(new Date().toLocaleTimeString());
        setRefreshMessage("Fresh data loaded successfully.");
      } catch (freshError) {
        const cachedResult = await fetchCachedData();

        setData(cachedResult);
        setLastUpdated(new Date().toLocaleTimeString());

        if (freshError.name === "AbortError") {
          setRefreshWarning(
            "Fresh FortyGuard processing took too long. Showing the most recent available data instead."
          );
        } else {
          setRefreshWarning(
            "Fresh FortyGuard update could not complete. Showing the most recent available data instead."
          );
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTriageData();
  }, []);

  const formatCacheAge = (seconds) => {
    if (typeof seconds !== "number") {
      return "";
    }

    const roundedSeconds = Math.max(0, Math.round(seconds));

    if (roundedSeconds < 10) {
      return "Cached just now";
    }

    if (roundedSeconds < 60) {
      return `Cached ${roundedSeconds} seconds ago`;
    }

    const minutes = Math.floor(roundedSeconds / 60);

    if (minutes === 1) {
      return "Cached 1 minute ago";
    }

    if (minutes < 60) {
      return `Cached ${minutes} minutes ago`;
    }

    const hours = Math.floor(minutes / 60);

    if (hours === 1) {
      return "Cached 1 hour ago";
    }

    return `Cached ${hours} hours ago`;
  };

  const getRiskColor = (level) => {
    switch (level) {
      case "LOW":
        return "#22c55e";

      case "MODERATE":
        return "#eab308";

      case "HIGH":
        return "#f59e0b";

      case "EXTREME":
        return "#ef4444";

      default:
        return "#64748b";
    }
  };

  const riskScore = data?.triage?.score ?? 0;
  const riskLevel = data?.triage?.level ?? "UNKNOWN";
  const riskColor = getRiskColor(riskLevel);

  const rankedNeighborhoods = neighborhoods
    .map((neighborhood) => {
      const elderlyScore = Math.min(
        (neighborhood.elderlyPercent / 30) * 100,
        100
      );

      const povertyScore = Math.min(
        (neighborhood.povertyPercent / 50) * 100,
        100
      );

      const priorityScore = Math.round(
        neighborhood.exposureScore * 0.5 +
          povertyScore * 0.3 +
          elderlyScore * 0.2
      );

      let priorityLevel = "LOW";

      if (priorityScore >= 75) {
        priorityLevel = "EXTREME";
      } else if (priorityScore >= 60) {
        priorityLevel = "HIGH";
      } else if (priorityScore >= 40) {
        priorityLevel = "MODERATE";
      }

      return {
        ...neighborhood,
        priorityScore,
        priorityLevel,
      };
    })
    .sort((a, b) => b.priorityScore - a.priorityScore);

  const topPriorityNeighborhood = rankedNeighborhoods[0];

  const shouldShowPriorityAlert =
    topPriorityNeighborhood &&
    ["HIGH", "EXTREME"].includes(topPriorityNeighborhood.priorityLevel);

  const tableHeaderStyle = {
    textAlign: "left",
    padding: "12px",
    borderBottom: "1px solid #475569",
    color: "#cbd5e1",
    fontSize: "12px",
  };

  const tableCellStyle = {
    padding: "12px",
    borderBottom: "1px solid #334155",
    fontSize: "13px",
  };

  return (
    <div className="app">
      <header className="hero">
        <p className="eyebrow">Phoenix Heat Monitoring</p>

        <h1>Heat Triage Dashboard</h1>

        <p className="subtitle">
          Real heat and environmental risk data powered by the FortyGuard API.
        </p>

        {data && (
          <>
            <p className="reading-time">
              Reading: {data.date} at {data.time}
            </p>

            <div className="data-status">
              <span
                className={
                  data.cached
                    ? "data-badge cached-badge"
                    : "data-badge live-badge"
                }
              >
                {data.cached ? "CACHED DATA" : "LIVE DATA"}
              </span>

              {data.cached &&
                typeof data.cache_age_seconds === "number" && (
                  <span className="cache-age">
                    {formatCacheAge(data.cache_age_seconds)}
                  </span>
                )}
            </div>
          </>
        )}

        {lastUpdated && (
          <p className="last-updated">
            Last refreshed: {lastUpdated}
          </p>
        )}

        <button
          className="refresh-button"
          onClick={() => fetchTriageData(true)}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh Data"}
        </button>

        {refreshMessage && (
          <p className="refresh-message">
            {refreshMessage}
          </p>
        )}

        {refreshWarning && (
          <p className="refresh-warning">
            {refreshWarning}
          </p>
        )}
      </header>

      <main className="dashboard">
        {shouldShowPriorityAlert && showPriorityAlert && (
          <section className="urgent-alert" role="alert">
            <div className="urgent-alert-icon" aria-hidden="true">
              !
            </div>

            <div className="urgent-alert-content">
              <p className="urgent-alert-eyebrow">
                {topPriorityNeighborhood.priorityLevel === "EXTREME"
                  ? "URGENT INTERVENTION ALERT"
                  : "HIGH PRIORITY INTERVENTION ALERT"}
              </p>

              <h2>
                {topPriorityNeighborhood.name} ({topPriorityNeighborhood.zip})
              </h2>

              <p>
                This neighborhood currently has the highest intervention
                priority in the prototype with a score of{" "}
                <strong>{topPriorityNeighborhood.priorityScore}/100</strong>.
              </p>

              <p className="urgent-alert-action">
                Recommended response: prioritize cooling-center access,
                hydration support, community outreach, welfare checks, and
                heat-safety messaging.
              </p>
            </div>

            <button
              type="button"
              className="urgent-alert-close"
              onClick={() => setShowPriorityAlert(false)}
              aria-label="Dismiss intervention alert"
            >
              ×
            </button>
          </section>
        )}
        {error && (
          <section className="card">
            <h2>Connection Error</h2>
            <p>{error}</p>
          </section>
        )}

        {!data && !error && (
          <section className="card">
            <h2>Loading</h2>
            <p>Connecting to the Heat Triage backend...</p>
          </section>
        )}

        {data && (
          <>
            <section className="card">
              <h2>Current Risk</h2>

              <h3>{data.triage?.level}</h3>

              <p>{data.triage?.message}</p>

              <p>
                Priority: {data.triage?.priority}
              </p>

              <div
                style={{
                  marginTop: "20px",
                  marginBottom: "24px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "10px",
                  }}
                >
                  <strong>Heat Risk Score</strong>

                  <strong
                    style={{
                      color: riskColor,
                      fontSize: "20px",
                    }}
                  >
                    {riskScore} / 100
                  </strong>
                </div>

                <div
                  style={{
                    width: "100%",
                    height: "16px",
                    background: "#334155",
                    borderRadius: "999px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${Math.min(
                        Math.max(riskScore, 0),
                        100
                      )}%`,
                      height: "100%",
                      background: riskColor,
                      borderRadius: "999px",
                      transition: "width 0.5s ease",
                    }}
                  />
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: "8px",
                    marginTop: "12px",
                    fontSize: "11px",
                    textAlign: "center",
                  }}
                >
                  <div>
                    <span
                      style={{
                        display: "inline-block",
                        width: "9px",
                        height: "9px",
                        borderRadius: "50%",
                        background: "#22c55e",
                        marginRight: "5px",
                      }}
                    />
                    LOW
                  </div>

                  <div>
                    <span
                      style={{
                        display: "inline-block",
                        width: "9px",
                        height: "9px",
                        borderRadius: "50%",
                        background: "#eab308",
                        marginRight: "5px",
                      }}
                    />
                    MODERATE
                  </div>

                  <div>
                    <span
                      style={{
                        display: "inline-block",
                        width: "9px",
                        height: "9px",
                        borderRadius: "50%",
                        background: "#f59e0b",
                        marginRight: "5px",
                      }}
                    />
                    HIGH
                  </div>

                  <div>
                    <span
                      style={{
                        display: "inline-block",
                        width: "9px",
                        height: "9px",
                        borderRadius: "50%",
                        background: "#ef4444",
                        marginRight: "5px",
                      }}
                    />
                    EXTREME
                  </div>
                </div>
              </div>

              <p>
                Recommended Action:{" "}
                {data.triage?.recommended_action}
              </p>

              {data.triage?.reasons?.length > 0 && (
                <div>
                  <h4>Why this risk level?</h4>

                  <ul>
                    {data.triage.reasons.map(
                      (reason, index) => (
                        <li key={index}>
                          {reason}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}
            </section>

            <section className="card">
              <h2>Temperature</h2>

              <p>
                Mean:{" "}
                {data.temperature?.mean_celsius?.toFixed(2)} °C
              </p>

              <p>
                Maximum:{" "}
                {data.temperature?.maximum_celsius?.toFixed(2)} °C
              </p>

              <p>
                Minimum:{" "}
                {data.temperature?.minimum_celsius?.toFixed(2)} °C
              </p>
            </section>

            <section className="card">
              <h2>Environmental Conditions</h2>

              <p>
                Heat Index:{" "}
                {data.environment?.heat_index_celsius} °C
              </p>

              <p>
                Apparent Temperature:{" "}
                {data.environment?.apparent_temperature_celsius} °C
              </p>

              <p>
                Relative Humidity:{" "}
                {data.environment?.relative_humidity_percent}%
              </p>

              <p>
                Wet-Bulb Temperature:{" "}
                {data.environment?.wet_bulb_temperature_celsius} °C
              </p>

              <p>
                Air Quality Index:{" "}
                {data.environment?.air_quality_index}
              </p>

              <div className="source-info">
                <h4>Data Trace</h4>

                <p>
                  Heat Activity ID:{" "}
                  {data.heat_activity_id}
                </p>

                <p>
                  Environment Activity ID:{" "}
                  {data.environment_activity_id}
                </p>
              </div>
            </section>

            <section className="card ranked-risk-card">
              <div className="ranked-risk-heading">
                <div>
                  <p className="ranked-risk-eyebrow">Neighborhood Priority</p>
                  <h2>Ranked Risk View</h2>
                  <p>
                    A quick view of which Phoenix neighborhoods currently rank
                    highest for intervention in this prototype.
                  </p>
                </div>

                {topPriorityNeighborhood && (
                  <div className="ranked-risk-summary">
                    <span>Top Priority</span>
                    <strong>{topPriorityNeighborhood.name}</strong>
                    <small>
                      {topPriorityNeighborhood.priorityScore}/100 ·{" "}
                      {topPriorityNeighborhood.priorityLevel}
                    </small>
                  </div>
                )}
              </div>

              <div className="ranked-risk-list">
                {rankedNeighborhoods.map((neighborhood, index) => (
                  <div className="ranked-risk-row" key={neighborhood.id}>
                    <div className="ranked-risk-rank">#{index + 1}</div>

                    <div className="ranked-risk-neighborhood">
                      <strong>{neighborhood.name}</strong>
                      <span>ZIP {neighborhood.zip}</span>
                    </div>

                    <div className="ranked-risk-bar-wrap">
                      <div className="ranked-risk-bar-track">
                        <div
                          className="ranked-risk-bar-fill"
                          style={{
                            width: `${neighborhood.priorityScore}%`,
                            background: getRiskColor(
                              neighborhood.priorityLevel
                            ),
                          }}
                        />
                      </div>
                    </div>

                    <div className="ranked-risk-score">
                      <strong>{neighborhood.priorityScore}</strong>
                      <span>/100</span>
                    </div>

                    <span
                      className="ranked-risk-level"
                      style={{
                        background: getRiskColor(neighborhood.priorityLevel),
                      }}
                    >
                      {neighborhood.priorityLevel}
                    </span>
                  </div>
                ))}
              </div>

              <p className="ranked-risk-note">
                Ranking uses prototype vulnerability inputs combined with local
                heat exposure. Demographic values are not verified Census
                statistics.
              </p>
            </section>

            <PhoenixHeatMap
              neighborhoods={rankedNeighborhoods}
              getRiskColor={getRiskColor}
            />

            {topPriorityNeighborhood && (
              <section
                className="card"
                style={{
                  border: `1px solid ${getRiskColor(
                    topPriorityNeighborhood.priorityLevel
                  )}`,
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: "12px",
                    fontWeight: "700",
                    letterSpacing: "0.08em",
                    color: getRiskColor(
                      topPriorityNeighborhood.priorityLevel
                    ),
                  }}
                >
                  TOP INTERVENTION PRIORITY
                </p>

                <h2
                  style={{
                    marginTop: "8px",
                    marginBottom: "8px",
                  }}
                >
                  {topPriorityNeighborhood.name}
                </h2>

                <p>
                  ZIP {topPriorityNeighborhood.zip}
                </p>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    flexWrap: "wrap",
                    marginTop: "14px",
                    marginBottom: "16px",
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      padding: "6px 10px",
                      borderRadius: "999px",
                      background: getRiskColor(
                        topPriorityNeighborhood.priorityLevel
                      ),
                      color: "#ffffff",
                      fontSize: "12px",
                      fontWeight: "700",
                    }}
                  >
                    {topPriorityNeighborhood.priorityLevel}
                  </span>

                  <strong>
                    Priority Score:{" "}
                    {topPriorityNeighborhood.priorityScore}/100
                  </strong>
                </div>

                <p>
                  This neighborhood currently ranks first because it has
                  the highest combined heat exposure and vulnerability
                  score in the prototype.
                </p>

                <div
                  style={{
                    marginTop: "18px",
                    padding: "16px",
                    borderRadius: "12px",
                    background: "rgba(15, 23, 42, 0.55)",
                  }}
                >
                  <strong>Recommended City Action</strong>

                  <p
                    style={{
                      marginBottom: 0,
                    }}
                  >
                    Prioritize cooling-center access, hydration distribution,
                    community outreach, welfare checks for vulnerable
                    residents, and heat-safety messaging in this area.
                  </p>
                </div>

                <p
                  style={{
                    marginTop: "14px",
                    fontSize: "12px",
                    color: "#94a3b8",
                  }}
                >
                  Neighborhood vulnerability values are demo prototype inputs.
                  FortyGuard heat and environmental readings are used
                  separately for the live heat triage layer.
                </p>
              </section>
            )}

            <section className="card">
              <h2>Who Should We Help First?</h2>

              <p>
                Neighborhoods are ranked using demo vulnerability inputs
                combined with local heat exposure.
              </p>

              <div
                style={{
                  overflowX: "auto",
                  marginTop: "20px",
                }}
              >
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    minWidth: "700px",
                  }}
                >
                  <thead>
                    <tr>
                      <th style={tableHeaderStyle}>
                        Rank
                      </th>

                      <th style={tableHeaderStyle}>
                        Neighborhood
                      </th>

                      <th style={tableHeaderStyle}>
                        ZIP
                      </th>

                      <th style={tableHeaderStyle}>
                        Heat Exposure
                      </th>

                      <th style={tableHeaderStyle}>
                        Poverty
                      </th>

                      <th style={tableHeaderStyle}>
                        Age 65+
                      </th>

                      <th style={tableHeaderStyle}>
                        Priority Score
                      </th>

                      <th style={tableHeaderStyle}>
                        Level
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {rankedNeighborhoods.map(
                      (neighborhood, index) => (
                        <tr key={neighborhood.id}>
                          <td style={tableCellStyle}>
                            #{index + 1}
                          </td>

                          <td style={tableCellStyle}>
                            <strong>
                              {neighborhood.name}
                            </strong>
                          </td>

                          <td style={tableCellStyle}>
                            {neighborhood.zip}
                          </td>

                          <td style={tableCellStyle}>
                            {neighborhood.exposureScore}/100
                          </td>

                          <td style={tableCellStyle}>
                            {neighborhood.povertyPercent}%
                          </td>

                          <td style={tableCellStyle}>
                            {neighborhood.elderlyPercent}%
                          </td>

                          <td style={tableCellStyle}>
                            <strong>
                              {neighborhood.priorityScore}/100
                            </strong>
                          </td>

                          <td style={tableCellStyle}>
                            <span
                              style={{
                                display: "inline-block",
                                padding: "5px 9px",
                                borderRadius: "999px",
                                fontSize: "11px",
                                fontWeight: "700",
                                color: "#ffffff",
                                background: getRiskColor(
                                  neighborhood.priorityLevel
                                ),
                              }}
                            >
                              {neighborhood.priorityLevel}
                            </span>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>

              <p
                style={{
                  marginTop: "16px",
                  fontSize: "12px",
                  color: "#94a3b8",
                }}
              >
                Demographic values are currently demo prototype inputs and
                should not be interpreted as verified Census statistics.
              </p>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default App;