import google.genai as genai
from google.genai import types
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
print('Sending...')
prompt = 'Return ONLY JSON: {"test": 1}'
response = client.models.generate_content(
    model='gemini-3.1-flash-lite-preview',
    contents=[prompt],
)
print('Got response:', response.text)
