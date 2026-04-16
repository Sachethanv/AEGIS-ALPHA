import express from 'express';
import cors from 'cors';
import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken  = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_FROM_NUMBER;     // Your Twilio number e.g. +1415XXXXXXX
const commandCenterNumber = process.env.COMMAND_CENTER_NUMBER; // HQ mobile number

/**
 * POST /api/send-alert
 * Body: {
 *   casualty: { id, name, rank, unit, bpm, spo2, lat, lng },
 *   recipients: [ { name, rank, phone } ],
 *   condition: "Hemorrhagic Shock",
 *   criticality: "CRITICAL",
 *   timeToTreat: "Immediate",
 *   action: "Extract and apply tourniquet"
 * }
 */
app.post('/api/send-alert', async (req, res) => {
  try {
    const { casualty, recipients, condition, criticality, timeToTreat, action } = req.body;

    if (!accountSid || !authToken || !fromNumber) {
      return res.status(500).json({ error: 'Twilio credentials not configured in .env' });
    }

    const client = twilio(accountSid, authToken);

    // Build a simplified SMS body to avoid carrier filtering
    const messageBody = 
`AEGIS ALERT: ${casualty.rank} ${casualty.name} is ${condition}. HR: ${casualty.bpm}, SpO2: ${casualty.spo2}%. GPS: ${casualty.lat.toFixed(4)}, ${casualty.lng.toFixed(4)}. Respond now.`;

    const sends: Promise<any>[] = [];

    // 1. Send to Command Center
    if (commandCenterNumber) {
      sends.push(
        client.messages.create({
          body: `[CMD CENTER]\n${messageBody}`,
          from: fromNumber,
          to: commandCenterNumber,
        })
      );
    }

    // 2. Send to 2 nearest soldiers
    for (const recipient of recipients) {
      if (recipient.phone && !recipient.phone.includes('XXXXXXXXXX')) {
        sends.push(
          client.messages.create({
            body: `[FIELD ALERT — CASUALTY NEARBY]\n${messageBody}\nRESPOND IMMEDIATELY.`,
            from: fromNumber,
            to: recipient.phone,
          })
        );
      }
    }

    const results = await Promise.allSettled(sends);

    const sent = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected');

    if (failed.length > 0) {
      console.error('[AEGIS SMS] Failures detail:');
      failed.forEach((f: any, i) => {
        console.error(`  - Failure ${i + 1}:`, f.reason?.message || f.reason);
      });
    }

    console.log(`[AEGIS] SMS batch complete: ${sent} success, ${failed.length} failed`);
    return res.json({ success: true, sent, failed: failed.length });
  } catch (err: any) {
    console.error('[AEGIS] Twilio error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// Root route for status check
app.get('/', (req, res) => {
  res.send(`
    <style>
      body { background: #0a121a; color: #00e87a; font-family: monospace; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
      .box { border: 1px solid #00e87a44; padding: 2rem; border-radius: 8px; background: rgba(0,232,122,0.05); text-align: center; }
      .status { font-weight: bold; margin-bottom: 1rem; }
      .meta { font-size: 0.8rem; color: #00d0ff; opacity: 0.7; }
    </style>
    <div class="box">
      <div class="status">● AEGIS TACTICAL SMS NET: ACTIVE</div>
      <div class="meta">PORT: ${PORT} | SERVICE: SMS_PROXY</div>
    </div>
  `);
});

// Health check JSON
app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'AEGIS-SMS', timestamp: new Date().toISOString() }));

const PORT = process.env.SMS_SERVER_PORT || 3001;
app.listen(PORT, () => {
  console.log(`[AEGIS SMS Server] Running on http://localhost:${PORT}`);
});
