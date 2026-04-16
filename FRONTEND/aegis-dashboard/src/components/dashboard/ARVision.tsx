import { useEffect, useState } from 'react';

const STREAM_URL = 'http://127.0.0.1:5000/video_feed';

export function ARVision() {
  const [timestamp, setTimestamp] = useState(new Date().toLocaleTimeString());
  const [fps, setFps] = useState(30);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimestamp(new Date().toLocaleTimeString());
      setFps(prev => Math.max(24, Math.min(32, prev + (Math.random() - 0.5) * 2)));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Web Speech API Integration
  useEffect(() => {
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => {
      setIsListening(false);
      // Auto-restart if we want continuous listening
      try { recognition.start(); } catch(e) {}
    };

    recognition.onresult = async (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript.trim();
      console.log("🎤 Dashboard Speech Captured:", transcript);
      
      if (transcript) {
        try {
          // Use localhost to avoid CORS mismatches with Vite dev server (localhost:5173)
          const response = await fetch('http://localhost:5000/speech', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: transcript }),
          });
          const result = await response.json();
          console.log("📡 HUD Sync Status:", result);
        } catch (err) {
          console.error("❌ Failed to sync speech to HUD:", err);
        }
      }
    };

    try {
      recognition.start();
    } catch (e) {
      console.error("STT Start Error:", e);
    }

    return () => {
      recognition.stop();
    };
  }, []);

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] bg-black overflow-hidden flex items-center justify-center mt-16">
      {/* The Video Stream */}
      <img
        src={STREAM_URL}
        alt="Tactical AR Feed"
        className="w-full h-full object-cover"
        onError={(e) => {
          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/1920x1080/060d12/00e87a?text=SIGNAL+LOST+-+ESTABLISHING+CONNECTION...';
        }}
      />

      {/* HUD Overlays */}
      <div className="absolute inset-0 pointer-events-none p-8 font-rajdhani">
        {/* Top Indicators */}
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--critical-red)] animate-pulse" />
                <span className="text-[var(--critical-red)] font-bold text-xs tracking-widest uppercase">REC ◉ LIVE</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isListening ? 'bg-[var(--accent-blue)] animation-pulse pulse-dot' : 'bg-gray-600'}`} />
                <span className={`${isListening ? 'text-[var(--accent-blue)]' : 'text-gray-600'} font-bold text-xs tracking-widest uppercase`}>
                  {isListening ? 'VOICE CAPTURE ON' : 'VOICE CAPTURE OFF'}
                </span>
              </div>
            </div>
            <div className="text-[var(--accent-green)] text-[0.65rem] font-mono tracking-widest">
              SOURCE: AEGIS-NODE_01 // {STREAM_URL}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[var(--accent-green)] font-bold text-lg tracking-wider">
              {timestamp}
            </div>
            <div className="text-[var(--accent-blue)] text-[0.65rem] font-mono">
              FPS: {fps.toFixed(1)} // LATENCY: 42ms
            </div>
          </div>
        </div>

        {/* Center Crosshair */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 opacity-40">
           <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-4 bg-[var(--accent-green)]" />
           <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-px h-4 bg-[var(--accent-green)]" />
           <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-px bg-[var(--accent-green)]" />
           <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-px bg-[var(--accent-green)]" />
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 border border-[var(--accent-green)] rounded-full border-dashed animate-spin-slow" />
        </div>

        {/* Corner Accents */}
        <div className="absolute top-12 left-12 w-16 h-16 border-t-2 border-l-2 border-[var(--accent-green)] opacity-70" />
        <div className="absolute top-12 right-12 w-16 h-16 border-t-2 border-r-2 border-[var(--accent-green)] opacity-70" />
        <div className="absolute bottom-12 left-12 w-16 h-16 border-b-2 border-l-2 border-[var(--accent-green)] opacity-70" />
        <div className="absolute bottom-12 right-12 w-16 h-16 border-b-2 border-r-2 border-[var(--accent-green)] opacity-70" />

        {/* Bottom Metadata */}
        <div className="absolute bottom-12 left-20 flex flex-col gap-2">
           <div className="flex gap-4">
              <div className="flex flex-col">
                 <span className="text-[var(--text-muted)] text-[0.5rem] uppercase tracking-tighter">AI Engine</span>
                 <span className="text-[var(--accent-green)] text-xs font-bold font-mono">VISION_v3.1_LITE</span>
              </div>
              <div className="flex flex-col border-l border-[rgba(0,232,122,0.2)] pl-4">
                 <span className="text-[var(--text-muted)] text-[0.5rem] uppercase tracking-tighter">Status</span>
                 <span className="text-[var(--accent-green)] text-xs font-bold font-mono">NOMINAL</span>
              </div>
           </div>
           <div className="w-48 h-1 bg-[rgba(0,232,122,0.1)] rounded-full overflow-hidden">
              <div className="h-full bg-[var(--accent-green)] w-2/3 animate-[pulse_2s_infinite]" />
           </div>
        </div>

        {/* Side Bars */}
        <div className="absolute left-12 top-1/4 bottom-1/4 w-1 flex flex-col gap-1 py-1">
           {[...Array(20)].map((_, i) => (
             <div key={i} className={`flex-1 w-full bg-[var(--accent-green)] ${i % 4 === 0 ? 'opacity-80' : 'opacity-20'}`} />
           ))}
        </div>
      </div>

      {/* Screen Effects */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_150px_rgba(0,0,0,0.8)]" />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle,transparent_40%,rgba(0,0,0,0.4)_100%)]" />
    </div>
  );
}
