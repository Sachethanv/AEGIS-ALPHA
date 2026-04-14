import { useState, useEffect, useRef } from 'react';
import { calculateBPM } from '../utils/signalProcessing';

export function useESP32Pulse(enabled: boolean = true) {
  const [bpm, setBpm] = useState<number>(0);
  const bufferRef = useRef<number[]>([]);
  const MAX_BUFFER_SIZE = 100; // 100 samples at 50ms = 5 seconds of data history

  useEffect(() => {
    if (!enabled) return;

    let isPolling = true;
    let pollTimeout: number;

    const pollDevice = async () => {
      if (!isPolling) return;

      try {
        const response = await fetch('/esp32-data', {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });

        if (response.ok) {
          const textData = await response.text();
          const irValue = parseInt(textData.trim(), 10);

          if (!isNaN(irValue)) {
            // Keep buffer within the maximum sliding window limit
            if (bufferRef.current.length >= MAX_BUFFER_SIZE) {
              bufferRef.current.shift();
            }
            bufferRef.current.push(irValue);
            
            // Console log the raw value so you can see it actively arriving in the browser console
            console.log("📡 Received IR:", irValue);

            // Once we have a healthy buffer, try to calculate BPM
            const calculatedBpm = calculateBPM(bufferRef.current, 50);
            
            if (bufferRef.current.length % 10 === 0) {
               console.log("🫀 Calculated BPM:", calculatedBpm, "| Buffer Size:", bufferRef.current.length);
            }

            // Update only if BPM returned a valid result (>0)
            if (calculatedBpm > 0) {
              setBpm(calculatedBpm);
            }
          }
        }
      } catch (error) {
        // Silently catch fetch errors (e.g. device disconnected) so we don't spam the console constantly
        // console.error("Error fetching from ESP32", error);
      }

      // Schedule the next poll in 50ms
      if (isPolling) {
        pollTimeout = window.setTimeout(pollDevice, 50);
      }
    };

    // Kick off polling
    pollDevice();

    return () => {
      isPolling = false;
      if (pollTimeout) clearTimeout(pollTimeout);
    };
  }, [enabled]);

  return bpm;
}
