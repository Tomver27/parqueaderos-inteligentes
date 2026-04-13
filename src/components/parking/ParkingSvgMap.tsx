"use client";

import type { ParkingWithSpaces } from "@/types";

function computeBounds(parkings: ParkingWithSpaces[]) {
  if (parkings.length === 0) {
    return { latMin: 4.6, latMax: 4.72, lngMin: -74.08, lngMax: -74.02 };
  }
  const lats = parkings.map((p) => Number(p.latitude));
  const lngs = parkings.map((p) => Number(p.longitude));
  const pad = 0.01;
  return {
    latMin: Math.min(...lats) - pad,
    latMax: Math.max(...lats) + pad,
    lngMin: Math.min(...lngs) - pad,
    lngMax: Math.max(...lngs) + pad,
  };
}

export default function ParkingSvgMap({
  parkings,
  selectedParking,
  onSelect,
}: {
  parkings: ParkingWithSpaces[];
  selectedParking: ParkingWithSpaces | null;
  onSelect: (p: ParkingWithSpaces) => void;
}) {
  const W = 800;
  const H = 500;
  const bounds = computeBounds(parkings);

  function toXY(lat: number, lng: number) {
    const x = ((lng - bounds.lngMin) / (bounds.lngMax - bounds.lngMin)) * W;
    const y = H - ((lat - bounds.latMin) / (bounds.latMax - bounds.latMin)) * H;
    return { x, y };
  }

  const horizontalStreets = [0.12, 0.25, 0.38, 0.52, 0.65, 0.78, 0.88];
  const verticalStreets = [0.1, 0.22, 0.35, 0.48, 0.6, 0.72, 0.85, 0.93];
  const majorH = [0.25, 0.52, 0.78];
  const majorV = [0.22, 0.48, 0.72];

  const blocks = [
    { x: 30, y: 30, w: 90, h: 70 }, { x: 140, y: 30, w: 100, h: 70 },
    { x: 260, y: 30, w: 80, h: 70 }, { x: 360, y: 30, w: 120, h: 70 },
    { x: 500, y: 30, w: 90, h: 70 }, { x: 610, y: 30, w: 80, h: 70 },
    { x: 710, y: 30, w: 70, h: 70 },
    { x: 30, y: 130, w: 90, h: 80 }, { x: 140, y: 130, w: 100, h: 80 },
    { x: 260, y: 130, w: 80, h: 80 }, { x: 360, y: 130, w: 120, h: 80 },
    { x: 500, y: 130, w: 90, h: 80 }, { x: 610, y: 130, w: 80, h: 80 },
    { x: 710, y: 130, w: 70, h: 80 },
    { x: 30, y: 240, w: 90, h: 70 }, { x: 140, y: 240, w: 100, h: 70 },
    { x: 260, y: 240, w: 80, h: 70 }, { x: 360, y: 240, w: 120, h: 70 },
    { x: 500, y: 240, w: 90, h: 70 }, { x: 610, y: 240, w: 80, h: 70 },
    { x: 710, y: 240, w: 70, h: 70 },
    { x: 30, y: 340, w: 90, h: 80 }, { x: 140, y: 340, w: 100, h: 80 },
    { x: 260, y: 340, w: 80, h: 80 }, { x: 360, y: 340, w: 120, h: 80 },
    { x: 500, y: 340, w: 90, h: 80 }, { x: 610, y: 340, w: 80, h: 80 },
    { x: 710, y: 340, w: 70, h: 80 },
    { x: 30, y: 440, w: 90, h: 50 }, { x: 140, y: 440, w: 100, h: 50 },
    { x: 260, y: 440, w: 80, h: 50 }, { x: 360, y: 440, w: 120, h: 50 },
    { x: 500, y: 440, w: 90, h: 50 }, { x: 610, y: 440, w: 80, h: 50 },
    { x: 710, y: 440, w: 70, h: 50 },
  ];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-full"
      style={{ background: "#0f1e35" }}
    >
      <rect width={W} height={H} fill="#0f1e35" />

      {blocks.map((b, i) => (
        <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} fill="#172035" rx={3} />
      ))}

      {horizontalStreets.map((t, i) => (
        <line key={`h${i}`} x1={0} y1={t * H} x2={W} y2={t * H}
          stroke={majorH.includes(t) ? "#1e3a5a" : "#162030"}
          strokeWidth={majorH.includes(t) ? 8 : 4} />
      ))}
      {verticalStreets.map((t, i) => (
        <line key={`v${i}`} x1={t * W} y1={0} x2={t * W} y2={H}
          stroke={majorV.includes(t) ? "#1e3a5a" : "#162030"}
          strokeWidth={majorV.includes(t) ? 8 : 4} />
      ))}

      {majorH.map((t, i) => (
        <line key={`dh${i}`} x1={0} y1={t * H} x2={W} y2={t * H}
          stroke="#1d4a6a" strokeWidth={1.5} strokeDasharray="12 8" />
      ))}
      {majorV.map((t, i) => (
        <line key={`dv${i}`} x1={t * W} y1={0} x2={t * W} y2={H}
          stroke="#1d4a6a" strokeWidth={1.5} strokeDasharray="12 8" />
      ))}

      {/* Parking markers */}
      {parkings.map((p) => {
        const { x, y } = toXY(Number(p.latitude), Number(p.longitude));
        const isSelected = selectedParking?.id === p.id;
        const size = isSelected ? 28 : 22;

        return (
          <g key={p.id} style={{ cursor: "pointer" }} onClick={() => onSelect(p)}>
            {isSelected && (
              <circle cx={x} cy={y - size} r={size + 8}
                fill="rgba(59,130,246,0.2)" stroke="#3b82f6" strokeWidth={1.5} />
            )}
            <path
              d={`M${x},${y} Q${x - size},${y - size * 0.5} ${x - size * 0.6},${y - size * 1.3} A${size * 0.7},${size * 0.7} 0 1 1 ${x + size * 0.6},${y - size * 1.3} Q${x + size},${y - size * 0.5} ${x},${y}Z`}
              fill={isSelected ? "#3b82f6" : "#1e293b"}
              stroke={isSelected ? "#60a5fa" : "#10b981"}
              strokeWidth={2}
            />
            <text x={x} y={y - size * 1.1} textAnchor="middle" dominantBaseline="middle"
              fill="white" fontSize={size * 0.55} fontWeight={800}>
              {p.totalSpots}
            </text>
            {isSelected && (
              <>
                <rect x={x - 65} y={y + 6} width={130} height={22} rx={5}
                  fill="rgba(15,30,53,0.95)" stroke="#3b82f6" strokeWidth={1} />
                <text x={x} y={y + 19} textAnchor="middle" fill="#e2e8f0" fontSize={8.5} fontWeight={600}>
                  {p.name.length > 24 ? p.name.slice(0, 24) + "…" : p.name}
                </text>
              </>
            )}
          </g>
        );
      })}

      {/* Compass */}
      <g transform={`translate(${W - 36}, 36)`}>
        <circle r={18} fill="rgba(0,0,0,0.5)" stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
        <text textAnchor="middle" y={-6} fill="#94a3b8" fontSize={10} fontWeight={700}>N</text>
        <polygon points="0,-14 3,-4 0,-8 -3,-4" fill="#06b6d4" />
        <polygon points="0,14 3,4 0,8 -3,4" fill="#475569" />
      </g>

      {/* Scale */}
      <g transform={`translate(20, ${H - 20})`}>
        <line x1={0} y1={0} x2={60} y2={0} stroke="#475569" strokeWidth={2} />
        <line x1={0} y1={-4} x2={0} y2={4} stroke="#475569" strokeWidth={2} />
        <line x1={60} y1={-4} x2={60} y2={4} stroke="#475569" strokeWidth={2} />
        <text x={30} y={-6} textAnchor="middle" fill="#64748b" fontSize={8}>~1 km</text>
      </g>
    </svg>
  );
}
