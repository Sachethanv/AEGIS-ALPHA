import google.genai as genai
from google.genai import types
client = genai.Client(api_key='AIzaSyCtbBOwCNl9bC3Zn39xte2dGr2vcc00zSM')
print('Sending...')
prompt = 'Return ONLY JSON: {"test": 1}'
response = client.models.generate_content(
    model='gemini-3.1-flash-lite-preview',
    contents=[prompt],
)
print('Got response:', response.text)
