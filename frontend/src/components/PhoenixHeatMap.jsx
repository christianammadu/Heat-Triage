import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import { useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

function FitMapToNeighborhoods({ neighborhoods }) {
  const map = useMap();

  useEffect(() => {
    if (!neighborhoods || neighborhoods.length === 0) {
      return;
    }

    const bounds = L.latLngBounds(
      neighborhoods.map((neighborhood) => [
        neighborhood.latitude,
        neighborhood.longitude,
      ])
    );

    map.fitBounds(bounds, {
      padding: [35, 35],
      maxZoom: 12,
    });
  }, [map, neighborhoods]);

  return null;
}

function PhoenixHeatMap({ neighborhoods, getRiskColor }) {
  const topNeighborhood = neighborhoods?.[0];

  const popupTextStyle = {
    margin: "7px 0",
    color: "#1f2937",
    fontSize: "13px",
    lineHeight: 1.45,
  };

  const popupLabelStyle = {
    color: "#111827",
    fontWeight: "700",
  };

  return (
    <section className="card">
      <h2>Phoenix Heat Priority Map</h2>

      <p>
        Neighborhood markers show the current prototype intervention priority.
        Click any marker to see its risk details.
      </p>

      <div
        style={{
          display: "flex",
          gap: "14px",
          flexWrap: "wrap",
          marginTop: "14px",
          marginBottom: "8px",
          fontSize: "11px",
          fontWeight: "700",
        }}
      >
        <span>
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
        </span>

        <span>
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
        </span>

        <span>
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
        </span>

        <span>
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
        </span>
      </div>

      <div
        style={{
          height: "430px",
          width: "100%",
          marginTop: "16px",
          borderRadius: "14px",
          overflow: "hidden",
          border: "1px solid #334155",
        }}
      >
        <MapContainer
          center={[33.4484, -112.074]}
          zoom={11}
          scrollWheelZoom={true}
          style={{
            height: "100%",
            width: "100%",
          }}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <FitMapToNeighborhoods neighborhoods={neighborhoods} />

          {neighborhoods.map((neighborhood, index) => {
            const isTopPriority =
              topNeighborhood &&
              neighborhood.id === topNeighborhood.id;

            return (
              <CircleMarker
                key={neighborhood.id}
                center={[
                  neighborhood.latitude,
                  neighborhood.longitude,
                ]}
                radius={
                  isTopPriority
                    ? 18
                    : neighborhood.priorityLevel === "EXTREME"
                      ? 16
                      : neighborhood.priorityLevel === "HIGH"
                        ? 14
                        : neighborhood.priorityLevel === "MODERATE"
                          ? 12
                          : 10
                }
                pathOptions={{
                  color: isTopPriority
                    ? "#ffffff"
                    : getRiskColor(neighborhood.priorityLevel),
                  fillColor: getRiskColor(
                    neighborhood.priorityLevel
                  ),
                  fillOpacity: 0.8,
                  weight: isTopPriority ? 4 : 3,
                }}
              >
                <Popup>
                  <div
                    style={{
                      minWidth: "220px",
                      color: "#1f2937",
                      background: "#ffffff",
                      fontFamily: "Inter, Arial, sans-serif",
                    }}
                  >
                    {isTopPriority && (
                      <div
                        style={{
                          display: "inline-block",
                          marginBottom: "10px",
                          padding: "5px 8px",
                          borderRadius: "999px",
                          background: "#fee2e2",
                          color: "#dc2626",
                          fontSize: "10px",
                          fontWeight: "800",
                          letterSpacing: "0.06em",
                        }}
                      >
                        TOP INTERVENTION PRIORITY
                      </div>
                    )}

                    <div
                      style={{
                        marginBottom: "10px",
                      }}
                    >
                      <strong
                        style={{
                          display: "block",
                          color: "#111827",
                          fontSize: "17px",
                          lineHeight: 1.25,
                        }}
                      >
                        #{index + 1} {neighborhood.name}
                      </strong>

                      <span
                        style={{
                          display: "block",
                          marginTop: "3px",
                          color: "#6b7280",
                          fontSize: "12px",
                        }}
                      >
                        ZIP {neighborhood.zip}
                      </span>
                    </div>

                    <div
                      style={{
                        padding: "10px 12px",
                        borderRadius: "10px",
                        background: "#f8fafc",
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      <p style={popupTextStyle}>
                        <span style={popupLabelStyle}>
                          Priority Score:
                        </span>{" "}
                        {neighborhood.priorityScore}/100
                      </p>

                      <p style={popupTextStyle}>
                        <span style={popupLabelStyle}>
                          Priority Level:
                        </span>{" "}
                        <span
                          style={{
                            color: getRiskColor(
                              neighborhood.priorityLevel
                            ),
                            fontWeight: "800",
                          }}
                        >
                          {neighborhood.priorityLevel}
                        </span>
                      </p>

                      <p style={popupTextStyle}>
                        <span style={popupLabelStyle}>
                          Heat Exposure:
                        </span>{" "}
                        {neighborhood.exposureScore}/100
                      </p>

                      <p style={popupTextStyle}>
                        <span style={popupLabelStyle}>
                          Poverty:
                        </span>{" "}
                        {neighborhood.povertyPercent}%
                      </p>

                      <p style={popupTextStyle}>
                        <span style={popupLabelStyle}>
                          Age 65+:
                        </span>{" "}
                        {neighborhood.elderlyPercent}%
                      </p>
                    </div>

                    {isTopPriority && (
                      <div
                        style={{
                          marginTop: "12px",
                          padding: "10px 12px",
                          borderRadius: "10px",
                          background: "#fff7ed",
                          border: "1px solid #fed7aa",
                        }}
                      >
                        <div
                          style={{
                            marginBottom: "4px",
                            color: "#9a3412",
                            fontSize: "11px",
                            fontWeight: "800",
                            textTransform: "uppercase",
                            letterSpacing: "0.04em",
                          }}
                        >
                          Recommended Response
                        </div>

                        <p
                          style={{
                            margin: 0,
                            color: "#7c2d12",
                            fontSize: "12px",
                            lineHeight: 1.5,
                          }}
                        >
                          Prioritize cooling access, hydration support,
                          community outreach, and welfare checks.
                        </p>
                      </div>
                    )}
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>

      <p
        style={{
          marginTop: "14px",
          fontSize: "12px",
          color: "#94a3b8",
        }}
      >
        The largest white-outlined marker represents the current top
        intervention priority. Neighborhood coordinates and demographic
        vulnerability values are prototype inputs. FortyGuard supplies the
        live heat and environmental data used by the heat triage layer.
      </p>
    </section>
  );
}

export default PhoenixHeatMap;