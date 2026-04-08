from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import mediapipe as mp
import numpy as np
import random

app = Flask(__name__)
CORS(app)

# ===== FACE MESH =====
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(static_image_mode=True)

# ===== GLOBAL STATE =====
last_status = {"alert": False}

# ===== CHATBOT =====
responses = {
    "sleepy": ["You seem sleepy. Try a short walk."],
    "tired": ["You sound tired. Take a short break."],
    "water": ["💧 Drink water! Stay hydrated."],
    "sleep": ["😴 Get 7-8 hours of rest."],
    "alert": ["🚨 No alert detected currently."]
}

fallback_responses = ["Stay alert and hydrated."]

def keyword_reply(text):
    text = text.lower()
    for key in responses:
        if key in text:
            return random.choice(responses[key])
    return random.choice(fallback_responses)

# ===== IMAGE ANALYSIS =====
@app.route('/analyze', methods=['POST'])
def analyze():
    try:
        file = request.files['image']
        water = float(request.form.get("water", 0))
        meals = int(request.form.get("meals", 0))

        image = cv2.imdecode(np.frombuffer(file.read(), np.uint8), cv2.IMREAD_COLOR)
        rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

        results = face_mesh.process(rgb)

        dark_score = 5
        sleep_status = "Unknown"

        if results.multi_face_landmarks:
            for face_landmarks in results.multi_face_landmarks:
                h, w, _ = image.shape

                pts = []
                for idx in [33,160,158,362,385,387]:
                    x = int(face_landmarks.landmark[idx].x * w)
                    y = int(face_landmarks.landmark[idx].y * h) + 10
                    pts.append((x,y))

                xs = [p[0] for p in pts]
                ys = [p[1] for p in pts]

                if min(xs) < max(xs) and min(ys) < max(ys):
                    crop = image[min(ys):max(ys), min(xs):max(xs)]
                    gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)

                    brightness = np.mean(gray)

                    if brightness < 120:
                        sleep_status = "Sleep Deprived"
                        dark_score = 4
                        last_status["alert"] = True
                    else:
                        sleep_status = "Normal"
                        dark_score = 9
                        last_status["alert"] = False

        hydration_score = min(10, water * 3)
        nutrition_score = min(10, meals * 3)

        overall = (dark_score + hydration_score + nutrition_score) / 3

        return jsonify({
            "sleep_status": sleep_status,
            "sleep_score": dark_score,
            "hydration_score": hydration_score,
            "nutrition_score": nutrition_score,
            "overall": round(overall, 1),
            "alert": last_status["alert"]
        })

    except Exception as e:
        print("Error:", e)
        return jsonify({"error": "Processing failed"})


# ===== STATUS =====
@app.route("/status")
def status():
    return jsonify(last_status)


# ===== CHAT =====
@app.route('/chat', methods=['POST'])
def chat():
    msg = request.json.get("message", "")
    reply = keyword_reply(msg)
    return jsonify({"reply": reply})


# ===== RUN =====
if __name__ == "__main__":
    app.run(debug=True)