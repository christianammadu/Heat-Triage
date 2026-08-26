import time
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS

from fortyguard import FortyGuardClient


# ---------------------------------------------------------
# Load environment variables from backend/.env
# ---------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")


# ---------------------------------------------------------
# Flask app
# ---------------------------------------------------------

app = Flask(__name__)
CORS(app)


# ---------------------------------------------------------
# FortyGuard client
# ---------------------------------------------------------

client = FortyGuardClient()


# ---------------------------------------------------------
# Phoenix test configuration
# ---------------------------------------------------------

CITY_NAME = "Phoenix, Arizona"

HEAT_DATE = "2025-07-15"
HEAT_TIME = "14:00"

ENV_START_TIME = "12:00"
ENV_END_TIME = "15:00"

ENV_LATITUDE = 33.4484
ENV_LONGITUDE = -112.0740


# ---------------------------------------------------------
# Triage cache
# ---------------------------------------------------------
# Cache the most recent successful combined triage result.
# This prevents every dashboard request from starting two
# expensive FortyGuard jobs.
# ---------------------------------------------------------

TRIAGE_CACHE = {
    "data": None,
    "timestamp": 0,
}

# Keep a successful result for 5 minutes.
CACHE_TTL_SECONDS = 300


# ---------------------------------------------------------
# Small Phoenix test area
# Coordinates are [longitude, latitude]
# ---------------------------------------------------------

PHOENIX_POLYGON = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "type": "Polygon",
                "coordinates": [
                    [
                        [-112.085, 33.440],
                        [-112.065, 33.440],
                        [-112.065, 33.455],
                        [-112.085, 33.455],
                        [-112.085, 33.440],
                    ]
                ],
            },
        }
    ],
}


# ---------------------------------------------------------
# Utility helpers
# ---------------------------------------------------------

def safe_mean(values):
    if not values:
        return None

    valid_values = [
        value
        for value in values
        if isinstance(value, (int, float))
    ]

    if not valid_values:
        return None

    return sum(valid_values) / len(valid_values)


def get_parameter_mean(parameters, name):
    value = parameters.get(name)

    if isinstance(value, list):
        return safe_mean(value)

    if isinstance(value, (int, float)):
        return value

    return None


# ---------------------------------------------------------
# Heat-risk classifier
# ---------------------------------------------------------

def classify_heat_risk(
    temperature_celsius,
    heat_index_celsius=None,
    apparent_temperature_celsius=None,
    wet_bulb_temperature_celsius=None,
    relative_humidity_percent=None,
    air_quality_index=None,
):
    score = 0
    reasons = []

    # -----------------------------------------------------
    # Base air/surface temperature
    # -----------------------------------------------------

    if temperature_celsius is None:
        reasons.append("Mean temperature data is unavailable.")

    elif temperature_celsius >= 40:
        score += 35
        reasons.append(
            f"Mean temperature is extremely high at "
            f"{temperature_celsius:.1f}°C."
        )

    elif temperature_celsius >= 37:
        score += 28
        reasons.append(
            f"Mean temperature is high at "
            f"{temperature_celsius:.1f}°C."
        )

    elif temperature_celsius >= 32:
        score += 18
        reasons.append(
            f"Mean temperature is elevated at "
            f"{temperature_celsius:.1f}°C."
        )

    else:
        score += 5

    # -----------------------------------------------------
    # Heat index
    # -----------------------------------------------------

    if heat_index_celsius is not None:
        if heat_index_celsius >= 41:
            score += 25
            reasons.append(
                f"Heat index is very high at "
                f"{heat_index_celsius:.1f}°C."
            )

        elif heat_index_celsius >= 35:
            score += 18
            reasons.append(
                f"Heat index is elevated at "
                f"{heat_index_celsius:.1f}°C."
            )

        elif heat_index_celsius >= 30:
            score += 10

    # -----------------------------------------------------
    # Apparent temperature
    # -----------------------------------------------------

    if apparent_temperature_celsius is not None:
        if apparent_temperature_celsius >= 42:
            score += 20
            reasons.append(
                f"Apparent temperature reaches "
                f"{apparent_temperature_celsius:.1f}°C."
            )

        elif apparent_temperature_celsius >= 38:
            score += 12
            reasons.append(
                f"Apparent temperature is high at "
                f"{apparent_temperature_celsius:.1f}°C."
            )

        elif apparent_temperature_celsius >= 33:
            score += 6

    # -----------------------------------------------------
    # Wet-bulb temperature
    # -----------------------------------------------------

    if wet_bulb_temperature_celsius is not None:
        if wet_bulb_temperature_celsius >= 30:
            score += 15
            reasons.append(
                f"Wet-bulb temperature is dangerously high at "
                f"{wet_bulb_temperature_celsius:.1f}°C."
            )

        elif wet_bulb_temperature_celsius >= 27:
            score += 10
            reasons.append(
                f"Wet-bulb temperature is elevated at "
                f"{wet_bulb_temperature_celsius:.1f}°C."
            )

        elif wet_bulb_temperature_celsius >= 24:
            score += 5

    # -----------------------------------------------------
    # Relative humidity
    # -----------------------------------------------------

    if relative_humidity_percent is not None:
        if relative_humidity_percent >= 70:
            score += 10
            reasons.append(
                f"Relative humidity is high at "
                f"{relative_humidity_percent:.1f}%."
            )

        elif relative_humidity_percent >= 55:
            score += 6

        elif relative_humidity_percent >= 40:
            score += 3

    # -----------------------------------------------------
    # Air quality
    # -----------------------------------------------------

    if air_quality_index is not None:
        if air_quality_index >= 150:
            score += 10
            reasons.append(
                f"Air quality is unhealthy with an index of "
                f"{air_quality_index:.1f}."
            )

        elif air_quality_index >= 100:
            score += 6
            reasons.append(
                f"Air quality is elevated with an index of "
                f"{air_quality_index:.1f}."
            )

        elif air_quality_index >= 50:
            score += 3

    # -----------------------------------------------------
    # Clamp score to 0–100
    # -----------------------------------------------------

    score = min(round(score), 100)

    # -----------------------------------------------------
    # Risk level
    # -----------------------------------------------------

    if score >= 75:
        level = "EXTREME"
        priority = 4
        message = (
            "Extreme heat-health risk. Immediate protective action "
            "is recommended."
        )
        recommended_action = (
            "Reduce outdoor exposure, prioritise cooling access, "
            "check vulnerable people, and consider urgent heat-response measures."
        )

    elif score >= 50:
        level = "HIGH"
        priority = 3
        message = (
            "High heat-health risk. Outdoor exposure should be "
            "reduced where possible."
        )
        recommended_action = (
            "Limit strenuous outdoor activity, increase hydration, "
            "use shaded or cooled spaces, and monitor vulnerable people."
        )

    elif score >= 25:
        level = "MODERATE"
        priority = 2
        message = (
            "Moderate heat-health risk. Conditions may become "
            "uncomfortable or unsafe for vulnerable people."
        )
        recommended_action = (
            "Stay hydrated, reduce prolonged sun exposure, "
            "and monitor heat-sensitive individuals."
        )

    else:
        level = "LOW"
        priority = 1
        message = (
            "Heat-health risk is currently relatively low."
        )
        recommended_action = (
            "Continue normal heat-safety precautions and stay hydrated."
        )

    if not reasons:
        reasons.append(
            "No major environmental risk trigger was detected."
        )

    return {
        "level": level,
        "priority": priority,
        "score": score,
        "message": message,
        "recommended_action": recommended_action,
        "reasons": reasons,
    }


# ---------------------------------------------------------
# Basic API test
# ---------------------------------------------------------

@app.route("/")
def home():
    return jsonify(
        {
            "message": "Heat Triage API is running",
            "city": CITY_NAME,
            "status": "ok",
        }
    )


# ---------------------------------------------------------
# Real FortyGuard heat endpoint
# ---------------------------------------------------------

@app.route("/api/heat")
def heat_data():
    try:
        response = client.create_heatmap(
            polygon_aoi=PHOENIX_POLYGON,
            start_date=HEAT_DATE,
            start_time=HEAT_TIME,
            filter_type=1,
            granularity=100,
        )

        result = response.get("result", {})
        stats = result.get("stats_data", {})

        temperature_stats = (
            stats.get("Temperature_stats")
            or stats.get("temperature_stats")
            or {}
        )

        return jsonify(
            {
                "status": "success",
                "city": CITY_NAME,
                "date": HEAT_DATE,
                "time": HEAT_TIME,
                "activity_id": response.get("activity_id"),
                "temperature_stats": temperature_stats,
                "number_of_cells": stats.get("n_cells"),
            }
        )

    except Exception as error:
        return jsonify(
            {
                "status": "error",
                "message": str(error),
            }
        ), 500


# ---------------------------------------------------------
# Environmental parameters endpoint
# ---------------------------------------------------------

@app.route("/api/environment")
def environmental_data():
    try:
        response = client.environmental_parameters(
            latitude=ENV_LATITUDE,
            longitude=ENV_LONGITUDE,
            temperature=39.72,
            start_date=HEAT_DATE,
            start_time=ENV_START_TIME,
            end_date=HEAT_DATE,
            end_time=ENV_END_TIME,
            filter_type=2,
        )

        result = response.get("result", {})
        locations = result.get("locations", [])

        if not locations:
            return jsonify(
                {
                    "status": "error",
                    "message": "No environmental location data was returned.",
                }
            ), 500

        location = locations[0]
        parameters = location.get("parameters", {})

        environmental_summary = {
            "heat_index_celsius": get_parameter_mean(
                parameters,
                "heat_index_celsius",
            ),
            "apparent_temperature_celsius": get_parameter_mean(
                parameters,
                "apparent_temperature_celsius",
            ),
            "wet_bulb_temperature_celsius": get_parameter_mean(
                parameters,
                "wet_bulb_temperature_celsius",
            ),
            "relative_humidity_percent": get_parameter_mean(
                parameters,
                "relative_humidity_percent",
            ),
            "air_quality_index": get_parameter_mean(
                parameters,
                "air_quality:idx",
            ),
        }

        return jsonify(
            {
                "status": "success",
                "city": CITY_NAME,
                "activity_id": response.get("activity_id"),
                "metadata": result.get("metadata", {}),
                "environment": environmental_summary,
            }
        )

    except Exception as error:
        return jsonify(
            {
                "status": "error",
                "message": str(error),
            }
        ), 500


# ---------------------------------------------------------
# Intelligent Heat Triage endpoint
# ---------------------------------------------------------

@app.route("/api/triage")
def heat_triage():
    try:

        # -------------------------------------------------
        # 0. Check the cache first
        # -------------------------------------------------

        current_time = time.time()

        force_refresh = (
            request.args.get("refresh", "").lower()
            in ("1", "true", "yes")
        )

        cache_is_valid = (
            TRIAGE_CACHE["data"] is not None
            and current_time - TRIAGE_CACHE["timestamp"]
            < CACHE_TTL_SECONDS
        )

        if cache_is_valid and not force_refresh:
            cached_payload = TRIAGE_CACHE["data"].copy()

            cached_payload["cached"] = True
            cached_payload["cache_age_seconds"] = round(
                current_time - TRIAGE_CACHE["timestamp"],
                1,
            )

            return jsonify(cached_payload)

        # -------------------------------------------------
        # 1. Get heatmap data
        # -------------------------------------------------

        heat_response = client.create_heatmap(
            polygon_aoi=PHOENIX_POLYGON,
            start_date=HEAT_DATE,
            start_time=HEAT_TIME,
            filter_type=1,
            granularity=100,
        )

        heat_result = heat_response.get("result", {})
        heat_stats = heat_result.get("stats_data", {})

        temperature_stats = (
            heat_stats.get("Temperature_stats")
            or heat_stats.get("temperature_stats")
            or {}
        )

        mean_temperature = temperature_stats.get("mean")
        maximum_temperature = temperature_stats.get("maximum")
        minimum_temperature = temperature_stats.get("minimum")

        # -------------------------------------------------
        # 2. Get environmental parameters
        # -------------------------------------------------

        environmental_response = client.environmental_parameters(
            latitude=ENV_LATITUDE,
            longitude=ENV_LONGITUDE,
            temperature=mean_temperature or 39.72,
            start_date=HEAT_DATE,
            start_time=ENV_START_TIME,
            end_date=HEAT_DATE,
            end_time=ENV_END_TIME,
            filter_type=2,
        )

        environmental_result = environmental_response.get(
            "result",
            {},
        )

        locations = environmental_result.get("locations", [])

        parameters = {}

        if locations:
            parameters = locations[0].get("parameters", {})

        heat_index = get_parameter_mean(
            parameters,
            "heat_index_celsius",
        )

        apparent_temperature = get_parameter_mean(
            parameters,
            "apparent_temperature_celsius",
        )

        wet_bulb_temperature = get_parameter_mean(
            parameters,
            "wet_bulb_temperature_celsius",
        )

        relative_humidity = get_parameter_mean(
            parameters,
            "relative_humidity_percent",
        )

        air_quality_index = get_parameter_mean(
            parameters,
            "air_quality:idx",
        )

        # -------------------------------------------------
        # 3. Calculate combined triage
        # -------------------------------------------------

        risk = classify_heat_risk(
            temperature_celsius=mean_temperature,
            heat_index_celsius=heat_index,
            apparent_temperature_celsius=apparent_temperature,
            wet_bulb_temperature_celsius=wet_bulb_temperature,
            relative_humidity_percent=relative_humidity,
            air_quality_index=air_quality_index,
        )

        # -------------------------------------------------
        # 4. Build final combined response
        # -------------------------------------------------

        response_payload = {
            "status": "success",
            "city": CITY_NAME,
            "date": HEAT_DATE,
            "time": HEAT_TIME,

            "heat_activity_id": heat_response.get(
                "activity_id"
            ),

            "environment_activity_id": environmental_response.get(
                "activity_id"
            ),

            "temperature": {
                "minimum_celsius": minimum_temperature,
                "mean_celsius": mean_temperature,
                "maximum_celsius": maximum_temperature,
            },

            "environment": {
                "heat_index_celsius": heat_index,
                "apparent_temperature_celsius": apparent_temperature,
                "wet_bulb_temperature_celsius": wet_bulb_temperature,
                "relative_humidity_percent": relative_humidity,
                "air_quality_index": air_quality_index,
            },

            "triage": risk,

            # False means these values came directly from
            # fresh FortyGuard processing.
            "cached": False,
            "cache_age_seconds": 0,
        }

        # -------------------------------------------------
        # 5. Save successful result into cache
        # -------------------------------------------------

        TRIAGE_CACHE["data"] = response_payload.copy()
        TRIAGE_CACHE["timestamp"] = time.time()

        return jsonify(response_payload)

    except Exception as error:
        return jsonify(
            {
                "status": "error",
                "message": str(error),
            }
        ), 500


# ---------------------------------------------------------
# Start Flask
# ---------------------------------------------------------

if __name__ == "__main__":
    app.run(debug=True, port=5000)
