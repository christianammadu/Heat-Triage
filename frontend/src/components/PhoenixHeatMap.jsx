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
                      minWidth: "210px",
                    }}
                  >
                    {isTopPriority && (
                      <p
                        style={{
                          margin: "0 0 8px 0",
                          fontSize: "11px",
                          fontWeight: "700",
                          color: "#ef4444",
                          letterSpacing: "0.05em",
                        }}
                      >
                        TOP INTERVENTION PRIORITY
                      </p>
                    )}

                    <strong
                      style={{
                        fontSize: "16px",
                      }}
                    >
                      #{index + 1} {neighborhood.name}
                    </strong>

                    <p style={{ margin: "7px 0" }}>
                      ZIP: {neighborhood.zip}
                    </p>

                    <p style={{ margin: "7px 0" }}>
                      <strong>Priority Score:</strong>{" "}
                      {neighborhood.priorityScore}/100
                    </p>

                    <p style={{ margin: "7px 0" }}>
                      <strong>Priority Level:</strong>{" "}
                      {neighborhood.priorityLevel}
                    </p>

                    <p style={{ margin: "7px 0" }}>
                      <strong>Heat Exposure:</strong>{" "}
                      {neighborhood.exposureScore}/100
                    </p>

                    <p style={{ margin: "7px 0" }}>
                      <strong>Poverty:</strong>{" "}
                      {neighborhood.povertyPercent}%
                    </p>

                    <p style={{ margin: "7px 0" }}>
                      <strong>Age 65+:</strong>{" "}
                      {neighborhood.elderlyPercent}%
                    </p>

                    {isTopPriority && (
                      <p
                        style={{
                          marginTop: "10px",
                          paddingTop: "8px",
                          borderTop: "1px solid #d1d5db",
                          fontSize: "12px",
                        }}
                      >
                        Recommended response: prioritize cooling access,
                        hydration support, outreach, and welfare checks.
                      </p>
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