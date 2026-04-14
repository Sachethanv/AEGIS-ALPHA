import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Soldier } from '../../data/soldiers';
import 'leaflet/dist/leaflet.css';

// Custom colored markers using DivIcon
function makeMarkerIcon(color: string, isWounded: boolean) {
  return L.divIcon({
    className: '',
    html: `
      <div style="
        width: 18px; height: 18px;
        background: ${color};
        border: 2px solid rgba(255,255,255,0.7);
        border-radius: 50%;
        box-shadow: 0 0 ${isWounded ? '14px' : '6px'} ${color};
        ${isWounded ? 'animation: blink 0.8s step-start infinite;' : ''}
      "></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

const STATUS_COLORS = {
  NOMINAL:  '#00e87a',
  ELEVATED: '#f5c518',
  CRITICAL: '#ff8800',
  WOUNDED:  '#ff3c3c',
};

// Auto-pan to focused soldier
function FlyTo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 15, { duration: 1.5, easeLinearity: 0.25 });
  }, [lat, lng, map]);
  return null;
}

interface Props {
  focusSoldier: Soldier;
  allSoldiers: Soldier[];
}

export function SoldierMap({ focusSoldier, allSoldiers }: Props) {
  return (
    <MapContainer
      center={[focusSoldier.lat, focusSoldier.lng]}
      zoom={14}
      style={{ height: '100%', width: '100%', background: '#0a1a24' }}
      zoomControl={false}
    >
      {/* Dark tactical tile layer */}
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />

      <FlyTo lat={focusSoldier.lat} lng={focusSoldier.lng} />

      {/* Plot all soldiers */}
      {allSoldiers.map(s => {
        const color = STATUS_COLORS[s.status];
        return (
          <Marker
            key={s.id}
            position={[s.lat, s.lng]}
            icon={makeMarkerIcon(color, s.status === 'WOUNDED')}
          >
            <Popup className="tactical-popup">
              <div className="font-mono text-[11px] bg-[#0a1a24] text-[#d4f5e9] p-1">
                <strong style={{ color }}>{s.id}</strong><br />
                {s.rank} {s.name}<br />
                BPM: <span style={{ color }}>{s.bpm}</span><br />
                <span className="uppercase">{s.status}</span>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
