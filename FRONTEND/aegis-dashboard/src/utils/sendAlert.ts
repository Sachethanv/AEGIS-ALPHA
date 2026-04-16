import type { Soldier } from '../data/soldiers';

interface AlertPayload {
  casualty: Soldier;
  recipients: Soldier[];
  condition: string;
  criticality: string;
  timeToTreat: string;
  action: string;
}

interface AlertResponse {
  success: boolean;
  sent: number;
  failed: number;
  error?: string;
}

/**
 * Sends a real Twilio SMS alert via the AEGIS backend server.
 * Returns the response from the server.
 */
export async function sendTwilioAlert(payload: AlertPayload): Promise<AlertResponse> {
  try {
    const res = await fetch('/api/send-alert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Unknown server error' }));
      console.error('[AEGIS SMS] Server error:', err);
      return { success: false, sent: 0, failed: 0, error: err.error };
    }

    return await res.json() as AlertResponse;
  } catch (err: any) {
    console.error('[AEGIS SMS] Fetch failed:', err.message);
    return { success: false, sent: 0, failed: 0, error: err.message };
  }
}
