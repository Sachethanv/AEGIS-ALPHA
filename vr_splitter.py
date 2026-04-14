import cv2
import numpy as np
import google.genai as genai
from google.genai import types
from flask import Flask, Response
import threading
import json
import re

# Use Gemini 1.5 Flash for the fastest battlefield inference
client = genai.Client(api_key="AIzaSyCtbBOwCNl9bC3Zn39xte2dGr2vcc00zSM")

app = Flask(__name__)
camera_url = "http://192.168.1.6:8080/video"

import time

# Global variables to store the latest AI data
current_data = {"box": [0, 0, 0, 0], "injury": "Scanning...", "guidance": "Waiting for analysis"}
lock = threading.Lock()
last_api_call = 0  # timestamp for API throttling

def call_gemini(frame):
    global current_data
    try:
        _, buffer = cv2.imencode('.jpg', frame)
        img_data = buffer.tobytes()
        
        # System instruction to force structured JSON output
        prompt = (
            "Analyze the image and identify the most critical medical wound. "
            "If a wound is found, provide its bounding box as [ymin, xmin, ymax, xmax] normalized from 0 to 1000. "
            "Provide the injury type and a short guidance action. "
            "If no wound is found, return box_2d as [0,0,0,0], injury as 'CLEAR', and guidance as 'Proceed'."
        )
        
        response = client.models.generate_content(
            model='gemini-3.1-flash-lite-preview',#don't change to 1.5 flash verion (always use gemini-3.1-flash-lite-preview)
            contents=[types.Part.from_bytes(data=img_data, mime_type='image/jpeg'), prompt],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                # Defining a schema helps Gemini reliably output the right JSON
                response_schema={
                    "type": "OBJECT",
                    "properties": {
                        "box_2d": {"type": "ARRAY", "items": {"type": "INTEGER"}},
                        "injury": {"type": "STRING"},
                        "guidance": {"type": "STRING"}
                    },
                    "required": ["box_2d", "injury", "guidance"]
                }
            )
        )
        
        # Parse the JSON output safely
        text = response.text.strip()
        if text.startswith("```json"): text = text[7:]
        elif text.startswith("```"): text = text[3:]
        if text.endswith("```"): text = text[:-3]
        data = json.loads(text.strip())
        with lock:
            current_data["box"] = data.get("box_2d", [0, 0, 0, 0])
            current_data["injury"] = data.get("injury", "Unknown")
            current_data["guidance"] = data.get("guidance", "N/A")
            print(f"Gemini Update: {current_data}")
    except Exception as e:
        print(f"Gemini Error: {e}")

def gen_frames():
    cap = cv2.VideoCapture(camera_url)
    global last_api_call

    while True:
        success, frame = cap.read()
        if not success: break

        current_time = time.time()
        # Throttling to once every 4 seconds to strictly obey the 
        # 5 RPM Free Tier limit of Gemini API
        if current_time - last_api_call > 5:
            last_api_call = current_time
            threading.Thread(target=call_gemini, args=(frame.copy(),), daemon=True).start()

        # 1. Standardize Frame for Single View
        view = cv2.resize(frame, (2532, 1170))

        # 2. Draw Dynamic HUD
        with lock:
            ymin, xmin, ymax, xmax = current_data["box"]
            injury = current_data["injury"]
            guidance = current_data["guidance"]

        # Convert normalized [0-1000] to pixels [2532x1170]
        start_point = (int(xmin * 2532 / 1000), int(ymin * 1170 / 1000))
        end_point = (int(xmax * 2532 / 1000), int(ymax * 1170 / 1000))

        if any(current_data["box"]): # Only draw if a box exists
            cv2.rectangle(view, start_point, end_point, (0, 0, 255), 4)
            
            # Label background for readability
            cv2.rectangle(view, (50, 50), (1216, 220), (0, 0, 0), -1)
            cv2.putText(view, f"STATUS: {injury.upper()}", (70, 110), 
                        cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 0, 255), 3)
            cv2.putText(view, f"ACTION: {guidance}", (70, 180), 
                        cv2.FONT_HERSHEY_SIMPLEX, 1.0, (255, 255, 255), 2)

        # 3. Final View
        ret, buffer = cv2.imencode('.jpg', view)
        yield (b'--frame\r\n' b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')

@app.route('/')
def index():
    html = """
    <html>
      <head>
        <title>AEGIS VR HUD</title>
        <style>
          body, html { margin: 0; padding: 0; height: 100%; background-color: black; overflow: hidden; }
          img { display: block; width: 100%; height: 100%; object-fit: contain; }
        </style>
      </head>
      <body>
        <img src="/video_feed" />
      </body>
    </html>
    """
    return html

@app.route('/video_feed')
def video_feed():
    return Response(gen_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)