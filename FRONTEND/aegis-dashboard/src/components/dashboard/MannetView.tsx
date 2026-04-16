import { useMemo } from 'react';
import type { Soldier } from '../../data/soldiers';
import { getDistanceMeters } from '../../utils/geoUtils';

interface Props {
  soldiers: Soldier[];
}

const MANNET_RANGE_METERS = 800; // Communication range for ad-hoc link

export function MannetView({ soldiers }: Props) {
  // Compute active links for the mesh network
  const links = useMemo(() => {
    const activeLinks: { from: string, to: string, distance: number }[] = [];
    for (let i = 0; i < soldiers.length; i++) {
      for (let j = i + 1; j < soldiers.length; j++) {
        const dist = getDistanceMeters(
          soldiers[i].lat, soldiers[i].lng,
          soldiers[j].lat, soldiers[j].lng
        );
        if (dist <= MANNET_RANGE_METERS) {
          activeLinks.push({ from: soldiers[i].id, to: soldiers[j].id, distance: dist });
        }
      }
    }
    return activeLinks;
  }, [soldiers]);

  // Map coordinates to a tactical grid [1000x1000]
  // We'll center the grid around the average position
  const bounds = useMemo(() => {
    if (soldiers.length === 0) return { minLat: 0, maxLat: 1, minLng: 0, maxLng: 1 };
    let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
    soldiers.forEach(s => {
      minLat = Math.min(minLat, s.lat);
      maxLat = Math.max(maxLat, s.lat);
      minLng = Math.min(minLng, s.lng);
      maxLng = Math.max(maxLng, s.lng);
    });
    // Add some padding
    const latSpan = Math.max(0.01, maxLat - minLat);
    const lngSpan = Math.max(0.01, maxLng - minLng);
    return {
      minLat: minLat - latSpan * 0.2,
      maxLat: maxLat + latSpan * 0.2,
      minLng: minLng - lngSpan * 0.2,
      maxLng: maxLng + lngSpan * 0.2,
    };
  }, [soldiers]);

  const project = (lat: number, lng: number) => {
    const x = ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 800 + 100;
    const y = 800 - (((lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * 800) + 100;
    return { x, y };
  };

  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-4rem)] pt-16 px-6 pb-6 select-none bg-transparent">
      {/* Header Info */}
      <div className="flex items-center justify-between mb-8 py-4 border-b border-[var(--bg-border)]">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--accent-blue)] animate-pulse shadow-[0_0_8px_var(--accent-blue)]" />
            <h2 className="text-[var(--accent-blue)] font-rajdhani font-bold tracking-[0.3em] text-lg">TACTICAL MANNET</h2>
          </div>
          <p className="text-[var(--text-muted)] text-[0.6rem] font-mono tracking-widest uppercase">
            Mobile Ad-hoc Network // Active Nodes: {soldiers.length} // Mesh Links: {links.length}
          </p>
        </div>
        
        <div className="flex gap-8">
          <div className="text-right">
            <p className="text-[0.55rem] text-[var(--text-muted)] font-mono tracking-widest">ENCRYPTION</p>
            <p className="text-xs text-[var(--accent-green)] font-mono font-bold">AES-256-GCM</p>
          </div>
          <div className="text-right">
            <p className="text-[0.55rem] text-[var(--text-muted)] font-mono tracking-widest">BANDWIDTH</p>
            <p className="text-xs text-[var(--accent-green)] font-mono font-bold">12.4 MBPS / NODE</p>
          </div>
        </div>
      </div>

      <div className="flex-1 relative flex gap-6">
        {/* Network Visualization Container */}
        <div className="flex-1 relative rounded-xl border border-[var(--bg-border)] bg-[rgba(1,15,25,0.4)] overflow-hidden">
          {/* Tactical Background Grid */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(var(--accent-blue) 0.5px, transparent 0.5px)', backgroundSize: '40px 40px' }} />
          
          <svg viewBox="0 0 1000 1000" className="w-full h-full p-10">
            {/* Draw Mesh Links */}
            {links.map((link) => {
              const fromS = soldiers.find(s => s.id === link.from)!;
              const toS = soldiers.find(s => s.id === link.to)!;
              const p1 = project(fromS.lat, fromS.lng);
              const p2 = project(toS.lat, toS.lng);
              
              const quality = 1 - (link.distance / MANNET_RANGE_METERS);
              const color = quality > 0.6 ? 'var(--accent-green)' : quality > 0.3 ? 'var(--warn-yellow)' : 'var(--critical-red)';
              
              return (
                <g key={`${link.from}-${link.to}`}>
                  <line
                    x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                    stroke={color}
                    strokeWidth="1.5"
                    strokeOpacity={0.3 + quality * 0.4}
                    strokeDasharray="4 4"
                  />
                  {/* Animated packets */}
                  <circle r="2" fill={color}>
                    <animateMotion
                      dur={`${1 + (1 - quality) * 3}s`}
                      repeatCount="indefinite"
                      path={`M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`}
                    />
                  </circle>
                </g>
              );
            })}

            {/* Draw Nodes */}
            {soldiers.map((soldier) => {
              const p = project(soldier.lat, soldier.lng);
              const isReal = soldier.isRealDevice;
              
              return (
                <g key={soldier.id} className="cursor-pointer group">
                  {/* Halo */}
                  <circle
                    cx={p.x} cy={p.y} r={isReal ? "12" : "8"}
                    fill="transparent"
                    stroke={isReal ? 'var(--accent-blue)' : 'var(--accent-green)'}
                    strokeWidth="1"
                    className={isReal ? 'animate-pulse' : ''}
                    opacity="0.3"
                  />
                  
                  {/* Core */}
                  <circle
                    cx={p.x} cy={p.y} r={isReal ? "5" : "4"}
                    fill={isReal ? 'var(--accent-blue)' : 'var(--accent-green)'}
                    className="shadow-lg"
                  />

                  {/* Label */}
                  <g transform={`translate(${p.x + 12}, ${p.y - 12})`}>
                     <rect x="-2" y="-12" width="100" height="24" fill="rgba(0,0,0,0.7)" rx="4" className="hidden group-hover:block" />
                     <text
                        className="text-[0.7rem] font-mono font-bold fill-[var(--text-primary)]"
                        style={{ fontSize: '14px', pointerEvents: 'none' }}
                      >
                        {soldier.rank} {soldier.name}
                      </text>
                      <text
                        y="18"
                        className="text-[0.5rem] font-mono fill-[var(--text-muted)]"
                        style={{ fontSize: '10px', pointerEvents: 'none' }}
                      >
                        {isReal ? 'AEGIS-HUB' : 'MESH-NODE'} | DIST: {bounds.minLat.toFixed(5)}
                      </text>
                  </g>
                </g>
              );
            })}
          </svg>

          {/* HUD Brackets */}
          <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-[var(--accent-blue)] opacity-40" />
          <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-[var(--accent-blue)] opacity-40" />
          <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-[var(--accent-blue)] opacity-40" />
          <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-[var(--accent-blue)] opacity-40" />
          
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-[rgba(0,232,122,0.1)] border border-[var(--accent-green)] rounded text-[0.6rem] text-[var(--accent-green)] font-mono tracking-widest">
            REAL-TIME MESH TOPOLOGY ACTIVE
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="w-80 flex flex-col gap-4">
          <div className="p-4 rounded-xl border border-[var(--bg-border)] bg-[rgba(1,15,25,0.4)]">
            <h3 className="text-[var(--accent-blue)] text-xs font-bold tracking-widest mb-3 uppercase">Bridge Sync Status</h3>
            <div className="space-y-4">
               <div>
                  <div className="flex justify-between text-[0.6rem] mb-1">
                    <span className="text-[var(--text-muted)]">INFRASTRUCTURE LINK</span>
                    <span className="text-[var(--accent-green)]">CONNECTED</span>
                  </div>
                  <div className="h-1 bg-[rgba(255,255,255,0.05)] rounded-full overflow-hidden">
                    <div className="h-full bg-[var(--accent-green)] w-full shadow-[0_0_8px_var(--accent-green)]" />
                  </div>
               </div>
               <div>
                  <div className="flex justify-between text-[0.6rem] mb-1">
                    <span className="text-[var(--text-muted)]">TACTICAL MANNET</span>
                    <span className="text-[var(--accent-blue)]">BROADCASTING</span>
                  </div>
                  <div className="h-1 bg-[rgba(255,255,255,0.05)] rounded-full overflow-hidden">
                    <div className="h-full bg-[var(--accent-blue)] w-3/4 animate-pulse shadow-[0_0_8px_var(--accent-blue)]" />
                  </div>
               </div>
            </div>
          </div>

          <div className="flex-1 p-4 rounded-xl border border-[var(--bg-border)] bg-[rgba(1,15,25,0.4)] overflow-y-auto">
             <h3 className="text-[var(--accent-blue)] text-xs font-bold tracking-widest mb-3 uppercase">Node Registry</h3>
             <div className="space-y-2">
                {soldiers.map(s => (
                  <div key={s.id} className="p-2 rounded border border-[var(--bg-border)] bg-[rgba(255,255,255,0.02)]">
                     <div className="flex justify-between items-center">
                        <span className="text-[0.65rem] font-bold text-[var(--text-primary)]">{s.rank} {s.name}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${s.isRealDevice ? 'bg-[var(--accent-blue-dim)] text-[var(--accent-blue)]' : 'bg-[rgba(255,255,255,0.05)] text-[var(--text-muted)]'}`}>
                          {s.isRealDevice ? 'MASTER' : 'SLAVE'}
                        </span>
                     </div>
                     <div className="flex justify-between mt-1 text-[0.55rem]">
                        <span className="text-[var(--text-muted)]">HOP COUNT</span>
                        <span className="text-[var(--text-secondary)]">{s.isRealDevice ? '0' : '1'}</span>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
