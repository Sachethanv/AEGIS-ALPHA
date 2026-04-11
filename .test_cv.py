import cv2
from vr_splitter import call_gemini, current_data
import time

camera_url = "http://192.168.1.11:8080/video"
cap = cv2.VideoCapture(camera_url)
success, frame = cap.read()
if success:
    print("Sending to Gemini...")
    call_gemini(frame)
    print("Result:", current_data)
