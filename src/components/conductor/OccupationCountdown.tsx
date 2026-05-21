"use client";

import { useState, useEffect } from "react";
import { Clock, MapPin } from "lucide-react";

export type TimerEntry = {
  reservationId: number;
  spaceName: string;
  parkingName: string;
  occupationStart: string;
  totalMinutes: number;
};

function parseDbDate(s: string): Date {
  return new Date(s.endsWith("Z") || s.includes("+") ? s : s + "Z");
}

function formatTime(ms: number): string {
  if (ms <= 0) return "00:00:00";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function OccupationCountdown({ timers }: { timers: TimerEntry[] }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (timers.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Clock size={18} className="text-emerald-400" />
        <h2 className="text-lg font-semibold">Tiempo en parqueadero</h2>
      </div>

      <div className="flex flex-col gap-3">
        {timers.map((t) => {
          const startMs = parseDbDate(t.occupationStart).getTime();
          const totalMs = t.totalMinutes * 60 * 1000;
          const remainingMs = totalMs - (now - startMs);
          const expired = remainingMs <= 0;
          const pct = Math.max(0, Math.min(100, (remainingMs / totalMs) * 100));

          const barColor = expired
            ? "#ef4444"
            : pct > 50
            ? "#10b981"
            : pct > 20
            ? "#f59e0b"
            : "#ef4444";

          return (
            <div
              key={t.reservationId}
              className="rounded-2xl p-5"
              style={{
                background: "#0f172a",
                border: `1px solid ${expired ? "rgba(239,68,68,0.3)" : "rgba(16,185,129,0.25)"}`,
              }}
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="space-y-1">
                  <p className="text-white font-semibold">
                    {t.parkingName} · {t.spaceName}
                  </p>
                  <p className="text-xs flex items-center gap-1" style={{ color: "#64748b" }}>
                    <MapPin size={11} />
                    Reserva #{t.reservationId} · {t.totalMinutes} min pagados
                  </p>
                </div>

                <div className="text-right">
                  <p
                    className="font-black tabular-nums"
                    style={{ fontSize: "2.2rem", color: barColor, lineHeight: 1 }}
                  >
                    {expired ? "00:00:00" : formatTime(remainingMs)}
                  </p>
                  <p className="text-xs mt-1" style={{ color: expired ? "#f87171" : "#64748b" }}>
                    {expired ? "Tiempo agotado" : "restantes"}
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div
                className="mt-4 rounded-full overflow-hidden"
                style={{ height: 6, background: "rgba(255,255,255,0.06)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{ width: `${pct}%`, background: barColor }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
