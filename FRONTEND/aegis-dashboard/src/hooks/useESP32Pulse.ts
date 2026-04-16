import { useState, useEffect } from 'react';

export function useESP32Pulse(enabled: boolean = true) {
  const [vitals, setVitals] = useState<{ bpm: number, spo2: number }>({ bpm: 0, spo2: 0 });

  useEffect(() => {
    if (!enabled) return;

    let isPolling = true;
    let pollTimeout: number;

    const pollDevice = async () => {
      if (!isPolling) return;

      try {
        // ALWAYS use the Vite proxy so we fetch the raw text number off the ESP32 /data route
        const response = await fetch('/esp32-data', {
          method: 'GET',
          headers: { 'Cache-Control': 'no-cache' }
        });

        if (response.ok) {
          const textData = await response.text();
          const irValue = parseInt(textData.trim(), 10);

          if (!isNaN(irValue) && irValue >= 2500) {  // Basic sanity check for finger presence

            // DEMO STATE ENGINE:
            // Custom rules requested by USER mapping IR values directly to specific AEGIS medical states

            let calculatedBpm = 0;
            let calculatedSpo2 = 0;

            if (irValue >= 73000 && irValue <= 95000) {
              // 1. STABLE STATE [73000 to 95000]
              // Map IR percentage cleanly between 60 -> 100 BPM
              const irRange = 95000 - 73000;
              const dropPercent = (95000 - irValue) / irRange; // 0.0 at 95k, 1.0 at 73k
              const baseBpm = 60 + (dropPercent * 40);

              // Apply random +/- 5 jitter
              const jitter = Math.floor(Math.random() * 11) - 5;
              calculatedBpm = baseBpm + jitter;

              // SpO2 stays extremely healthy [95% - 100%]
              calculatedSpo2 = 99 - Math.floor(dropPercent * 4);

            } else if (irValue < 73000) {
              // 2. WOUNDED STATE [< 73000 IR]
              // Force BPM violently up (> 150) and SpO2 dangerously low (< 85) to trigger AEGIS Twilio SMS limits
              const severity = Math.min(1.0, (73000 - irValue) / 10000); // Caps at 63,000 IR

              const jitter = Math.floor(Math.random() * 15) - 5;
              calculatedBpm = 155 + (severity * 30) + jitter; // Spikes to 155 - 190 BPM

              calculatedSpo2 = 84 - Math.floor(severity * 10); // Drops to 74% - 84%

            } else if (irValue > 95000) {
              // 3. RESTING STATE [> 95000 IR]
              // Super calm, resting pulse
              calculatedBpm = 62 + (Math.random() * 6 - 3);
              calculatedSpo2 = 99;
            }

            // Clamp max limits just in case
            if (calculatedBpm > 220) calculatedBpm = 220;
            if (calculatedBpm < 40) calculatedBpm = 40;

            setVitals({
              bpm: Math.round(calculatedBpm),
              spo2: calculatedSpo2
            });

            console.log(`📡 Raw IR: ${irValue} ➡️ Inversely Proportional BPM: ${Math.round(calculatedBpm)} | SpO2: ${calculatedSpo2}`);

          } else {
             // Finger removed or totally bad read (< 2500 IR count)
             setVitals({ bpm: 0, spo2: 0 });
          }
        }
      } catch (error) {
        // Silently catch fetch errors to avoid spamming the console
      }

      // Snappy polling updates to guarantee every single change fires
      if (isPolling) {
        pollTimeout = window.setTimeout(pollDevice, 40);
      }
    };

    pollDevice();

    return () => {
      isPolling = false;
      if (pollTimeout) clearTimeout(pollTimeout);
    };
  }, [enabled]);

  return vitals;
}