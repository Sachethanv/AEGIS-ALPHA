import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini (Ensure API key is populated in Vite .env)
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "dummy-key-to-prevent-crash");

export interface TriageResult {
  condition: string;
  confidence: number;
  action: string;
  isTrauma: boolean;
}

export async function interpretVitals(bpm: number, spo2: number, bpmHistory: number[]): Promise<TriageResult> {
  if (!apiKey) {
    throw new Error("Missing VITE_GEMINI_API_KEY environment variable. AI Triage unavailable.");
  }

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const prompt = `
    You are 'Sentinel AI', a high-stakes, real-time medical triage assistant for military casualties on an active battlefield.
    You evaluate biometric anomalies from wearable sensors and classify trauma.
    
    Data Received:
    - Current Heart Rate: ${bpm} BPM
    - Current Blood Oxygen: ${spo2}% SpO2
    - Heart Rate History (last 30 seconds): [${bpmHistory.join(", ")}]

    Determine if this soldier is experiencing trauma.
    - Massive hemorrhage / shock usually presents as extreme tachycardia (>140) combined with dropping SpO2 (<94%), or sudden crashing bradycardia (<50).
    - Combat stress/exertion presents as high tachycardia (100-140) but WITH normal SpO2 (>95%).
    
    Return EXACTLY a JSON format response. DO NOT wrap the JSON in markdown blocks like \`\`\`json. Just standard raw text:
    {
      "condition": "Short 2-4 word medical diagnosis (e.g., 'Class III Hemorrhagic Shock', 'Acute Combat Stress', 'Stable Vitals')",
      "confidence": 95, 
      "action": "Urgent military action (e.g., 'Extract immediately, deploy tourniquet', 'Monitor closely')",
      "isTrauma": true or false
    }
  `;

  let parsedResult: TriageResult | null = null;
  let attempts = 0;
  let lastError: any = null;

  while (attempts < 3) {
    try {
      attempts++;
      const result = await model.generateContent(prompt);
      let textResult = result.response.text();

      // Strip markdown formatting if Gemini mistakenly included it
      textResult = textResult.replace(/```json/g, '').replace(/```/g, '').trim();

      parsedResult = JSON.parse(textResult);
      break; // Success! Exit the loop.
    } catch (error: any) {
      lastError = error;
      console.warn(`Gemini AI Triage attempt ${attempts} failed:`, error.message);
      
      // Only retry on network errors or 503/429 limits, not hard crash
      if (error.status === 403 || error.status === 404) break;
      
      // Wait for 1.5s before retrying to let Google servers cool off
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  }

  if (parsedResult) {
    return parsedResult;
  } else {
    console.error("Gemini AI Triage failure after retries:", lastError);
    return {
      condition: `ERR: ${lastError?.message?.substring(0, 45) || "Service Unavailable (503)"}`,
      confidence: 0,
      action: "Rely on Medevac protocol",
      isTrauma: bpm > 140 || spo2 < 92,
    };
  }
}
