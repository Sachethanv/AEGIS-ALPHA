import cv2
import numpy as np
import google.genai as genai
from google.genai import types
from flask import Flask, Response
import threading
import json
import re

# Use Gemini 1.5 Flash for the fastest battlefield inference
client = genai.Client(api_key="AIzaSyB3OC0c0LMvfMZmAhnk83b9bClYRXT1P1o")

app = Flask(__name__)
camera_url = "http://192.168.1.6:8080/video"

import time

# Global variables to store the latest AI data
current_data = {"box": [0, 0, 0, 0], "injury": "Scanning...", "guidance": "Waiting for analysis", "tourniquet": False}
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
            "Also check if a tourniquet has been applied to stop bleeding. Set 'tourniquet_applied' to true if you see one. "
            "If no wound is found, return box_2d as [0,0,0,0], injury as 'CLEAR', guidance as 'Proceed', and tourniquet_applied as false."
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
                        "guidance": {"type": "STRING"},
                        "tourniquet_applied": {"type": "BOOLEAN"}
                    },
                    "required": ["box_2d", "injury", "guidance", "tourniquet_applied"]
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
            current_data["tourniquet"] = data.get("tourniquet_applied", False)
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

        # Blackout Triage: Convert to Grayscale & Apply Jet Colormap
        gray = cv2.cvtColor(view, cv2.COLOR_BGR2GRAY)
        # Apply slight contrast enhancement to amplify heat signatures
        gray = cv2.equalizeHist(gray)
        view = cv2.applyColorMap(gray, cv2.COLORMAP_JET)

        # 2. Draw Dynamic HUD
        with lock:
            ymin, xmin, ymax, xmax = current_data["box"]
            injury = current_data["injury"]
            guidance = current_data["guidance"]
            tourniquet_applied = current_data.get("tourniquet", False)

        # Logical Colors
        if tourniquet_applied:
            info_color = (0, 255, 0) # Green for Hemorrhage Controlled
            injury_text = "HEMORRHAGE CONTROLLED"
            action_text = "Hemorrhage Controlled"
        else:
            info_color = (0, 0, 255) # Red for default wound
            injury_text = injury.upper()
            action_text = guidance

        # Convert normalized [0-1000] to pixels [2532x1170]
        c_xmin, c_ymin = int(xmin * 2532 / 1000), int(ymin * 1170 / 1000)
        c_xmax, c_ymax = int(xmax * 2532 / 1000), int(ymax * 1170 / 1000)

        if any(current_data["box"]): # Only draw if a box exists
            # AR Guidance: Pulsing center circle
            center_x = (c_xmin + c_xmax) // 2
            center_y = (c_ymin + c_ymax) // 2
            
            # Pulsing effect based on time
            pulse_radius = int(40 + 20 * np.sin(time.time() * 5))
            cv2.circle(view, (center_x, center_y), pulse_radius, info_color, 4)
            cv2.circle(view, (center_x, center_y), 5, info_color, -1)

            # Draw directional arrow if wound is at screen extremes
            if xmin < 100:
                # Point Left
                cv2.arrowedLine(view, (400, 585), (100, 585), (0, 255, 255), 10, tipLength=0.3)
                cv2.putText(view, "TURN LEFT", (150, 540), cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 255, 255), 4)
            elif xmax > 900:
                # Point Right
                cv2.arrowedLine(view, (2132, 585), (2432, 585), (0, 255, 255), 10, tipLength=0.3)
                cv2.putText(view, "TURN RIGHT", (2100, 540), cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 255, 255), 4)

            # Label background for readability
            cv2.rectangle(view, (50, 50), (1216, 220), (0, 0, 0), -1)
            cv2.putText(view, f"STATUS: {injury_text}", (70, 110), 
                        cv2.FONT_HERSHEY_SIMPLEX, 1.5, info_color, 3)
            cv2.putText(view, f"ACTION: {action_text}", (70, 180), 
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