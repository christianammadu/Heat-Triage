from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)


@app.route("/")
def home():
    return jsonify({
        "message": "Heat Triage API is running",
        "city": "Phoenix, Arizona",
        "status": "ok"
    })


if __name__ == "__main__":
    app.run(debug=True, port=5000)