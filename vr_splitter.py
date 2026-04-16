import cv2
import numpy as np
import google.genai as genai
from google.genai import types
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()
from flask import Flask, Response, request, jsonify
from flask_cors import CORS
import threading
import json
import time
import speech_recognition as sr
from queue import Queue
import socket

# Use the precise model requested
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

app = Flask(__name__)
CORS(app) # Enable CORS for dashboard-to-HUD communication

# Potential Camera Feed URLs (Infrastructure vs MANNET)
CAMERA_URLS = [
    "http://10.1.22.64:8080/video",    # Lecture Hall (Cloud Link)
    "http://192.168.4.3:8080/video",   # AEGIS Tactical (MANNET Hub)
]

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except:
        return "127.0.0.1"

# Automatically prioritize MANNET if we are on the tactical subnet
local_ip = get_local_ip()
if local_ip.startswith("192.168.4."):
    print(f"[*] Subnet Sensing: Tactical Network Detected ({local_ip}). Prioritizing MANNET Feed.")
    CAMERA_URLS = [CAMERA_URLS[1], CAMERA_URLS[0]]
else:
    print(f"[*] Subnet Sensing: Infrastructure Network Detected ({local_ip}).")

# Global state
current_data = {"box": [0, 0, 0, 0], "injury": "Scanning...", "guidance": "Standby", "tourniquet": False}
medic_speech_queue = Queue()
ai_handbook_list = ["WAITING FOR AI..."]
medic_speech_list = ["LISTENING..."]
lock = threading.Lock()
last_api_call = 0

class ScrollingHUD:
    def __init__(self, title, max_lines=3, scroll_period=2.0):
        self.lines = [f"--- {title} ---", "SYSTEM READY", "WAITING FOR DATA..."]
        self.max_lines = max_lines
        self.scroll_period = scroll_period
        self.start_time = time.time()

    def add_text(self, text, width_limit, font_scale, thickness):
        # Basic word wrap for HUD
        words = text.split()
        wrapped = []
        current_line = ""
        for word in words:
            test_line = current_line + " " + word if current_line else word
            (w, _) = cv2.getTextSize(test_line, cv2.FONT_HERSHEY_SIMPLEX, font_scale, thickness)[0]
            if w < width_limit:
                current_line = test_line
            else:
                wrapped.append(current_line)
                current_line = word
        if current_line:
            wrapped.append(current_line)
        
        for line in wrapped:
            self.lines.append(line)
            if len(self.lines) > self.max_lines:
                self.lines.pop(0)
        self.start_time = time.time() # Reset scroll timer on new text

    def get_render_offset(self):
        # Calculate vertical drift for "moving up" effect
        elapsed = time.time() - self.start_time
        if elapsed > self.scroll_period: return 0
        # Slowly move up (0 to 1) then snap
        return int((1.0 - (elapsed / self.scroll_period)) * 10)

ai_hud = ScrollingHUD("HANDBOOK")
medic_hud = ScrollingHUD("COMMS")

def run_stt():
    try:
        recognizer = sr.Recognizer()
        mic = sr.Microphone()
        print("[*] STT Engine Initialized. Listening for Medic Comms...")
    except Exception as e:
        print(f"[!] STT Error: Could not access microphone. {e}")
        return

    while True:
        try:
            with mic as source:
                recognizer.adjust_for_ambient_noise(source)
                audio = recognizer.listen(source, timeout=5, phrase_time_limit=10)
            text = recognizer.recognize_google(audio)
            with lock:
                medic_hud.add_text(text.upper(), 400, 0.6, 1)
        except Exception as e:
            pass # Silent fail for ambient gaps

def call_gemini(frame):
    global current_data
    try:
        small_frame = cv2.resize(frame, (640, 480))
        _, buffer = cv2.imencode('.jpg', small_frame, [int(cv2.IMWRITE_JPEG_QUALITY), 85])
        img_data = buffer.tobytes()
        
        prompt = (
            "Acting as a Medical Combat expert in TCCC (Tactical Combat Casualty Care), "
            "identify the injury and provide immediate life-saving guidance using the MARCH protocol. "
            "Return JSON: {'box_2d': [ymin, xmin, ymax, xmax], 'injury': str, 'guidance': str, 'tourniquet_applied': bool}. "
            "Maintain tactical focus. Guidance must be under 45 words."
        )
        
        response = client.models.generate_content(
            model='gemini-3.1-flash-lite-preview',
            contents=[types.Part.from_bytes(data=img_data, mime_type='image/jpeg'), prompt],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
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
        
        data = json.loads(response.text.strip())
        with lock:
            current_data["box"] = data.get("box_2d", [0, 0, 0, 0])
            current_data["injury"] = data.get("injury", "Unknown")
            current_data["guidance"] = data.get("guidance", "N/A")
            current_data["tourniquet"] = data.get("tourniquet_applied", False)
            ai_hud.add_text(current_data["guidance"].upper(), 400, 0.6, 1)
    except Exception as e:
        print(f"Inference Error: {e}")

def draw_hud_column(img, x_pos, y_start, title, lines, color, offset):
    # Draw Title
    cv2.putText(img, title, (x_pos, y_start - 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)
    # Draw Underline
    cv2.line(img, (x_pos, y_start - 20), (x_pos + 150, y_start - 20), color, 1)
    
    # Draw Lines with scrolling offset
    for i, line in enumerate(lines):
        y = y_start + (i * 40) - offset
        # Fade out top line based on offset
        alpha = 1.0 if i > 0 else (offset / 10.0)
        cv2.putText(img, line, (x_pos, y), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 1)

def draw_transparent_overlay(img, info_color):
    """Creates a high-tech translucent HUD base"""
    overlay = img.copy()
    # Semi-transparent dark boxes for the two columns
    cv2.rectangle(overlay, (40, 40), (450, 240), (10, 10, 10), -1) # Left
    cv2.rectangle(overlay, (img.shape[1]-450, 40), (img.shape[1]-40, 240), (10, 10, 10), -1) # Right
    alpha = 0.5
    cv2.addWeighted(overlay, alpha, img, 1 - alpha, 0, img)

def gen_frames():
    global last_api_call
    
    # Target Resolution
    TARGET_W, TARGET_H = 1920, 1080 
    
    current_url_index = 0
    cap = cv2.VideoCapture(CAMERA_URLS[current_url_index])
    print(f"[*] Initializing camera stream: {CAMERA_URLS[current_url_index]}")

    while True:
        success, frame = cap.read()
        
        if not success:
            # HANDOVER LOGIC: Cycle through URLs if connection is lost
            print(f"[!] Stream lost. Attempting handover...")
            cap.release()
            
            # Try next URL
            current_url_index = (current_url_index + 1) % len(CAMERA_URLS)
            next_url = CAMERA_URLS[current_url_index]
            print(f"[*] Trying handover target: {next_url}")
            
            cap = cv2.VideoCapture(next_url)
            time.sleep(1) # Give network time to settle
            continue

        curr_time = time.time()
        if curr_time - last_api_call > 10: # Reduced frequency for stability
            last_api_call = curr_time
            threading.Thread(target=call_gemini, args=(frame.copy(),), daemon=True).start()

        view = cv2.resize(frame, (TARGET_W, TARGET_H))

        with lock:
            box = current_data["box"]
            injury = current_data["injury"]
            tourniquet = current_data["tourniquet"]
            ai_lines = list(ai_hud.lines)
            medic_lines = list(medic_hud.lines)
            ai_offset = ai_hud.get_render_offset()
            medic_offset = medic_hud.get_render_offset()

        info_color = (0, 255, 0) if tourniquet else (0, 0, 255)
        
        # 1. Draw Transparent HUD Bases
        draw_transparent_overlay(view, info_color)

        # 2. Draw Left Column: AI HANDBOOK
        draw_hud_column(view, 60, 100, "📖 AI HANDBOOK", ai_lines, (0, 232, 122), ai_offset)

        # 3. Draw Right Column: MEDIC COMMS
        draw_hud_column(view, TARGET_W - 430, 100, "🎙️ MEDIC COMMS", medic_lines, (255, 200, 0), medic_offset)

        # 4. Draw Tracking Reticle
        if any(box):
            ymin, xmin, ymax, xmax = box
            cx1, cy1 = int(xmin * TARGET_W / 1000), int(ymin * TARGET_H / 1000)
            cx2, cy2 = int(xmax * TARGET_W / 1000), int(ymax * TARGET_H / 1000)
            center = ((cx1 + cx2) // 2, (cy1 + cy2) // 2)
            pulse = int(30 + 15 * np.sin(time.time() * 6))
            cv2.circle(view, center, pulse, info_color, 3)
            cv2.drawMarker(view, center, info_color, cv2.MARKER_CROSS, 40, 2)
            cv2.putText(view, injury.upper(), (cx1, cy1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.8, info_color, 2)

        # Encode
        ret, buffer = cv2.imencode('.jpg', view, [int(cv2.IMWRITE_JPEG_QUALITY), 70])
        yield (b'--frame\r\n' b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')

@app.route('/')
def index():
    return """
    <html>
      <body style="margin:0; background:black; display:flex; justify-content:center; align-items:center;">
        <img src="/video_feed" style="width:100vw; height:100vh; object-fit:cover;" />
      </body>
    </html>
    """

@app.route('/video_feed')
def video_feed():
    return Response(gen_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/speech', methods=['POST'])
def handle_speech():
    try:
        data = request.get_json()
        text = data.get('text', '')
        if text:
            print(f"[DASHBOARD STT] Received: {text}")
            with lock:
                medic_hud.add_text(text.upper(), 400, 0.6, 1)
            return jsonify({"status": "success", "received": text}), 200
        return jsonify({"status": "error", "message": "No text provided"}), 400
    except Exception as e:
        print(f"[DASHBOARD STT] Error: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    # Start STT thread once at server startup
    threading.Thread(target=run_stt, daemon=True).start()
    app.run(host='0.0.0.0', port=5000, threaded=True)