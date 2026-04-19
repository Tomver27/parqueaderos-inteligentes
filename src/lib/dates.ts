/** Colombia timezone helpers (America/Bogota, UTC−05:00) */

export const TZ = "America/Bogota";

/** Format a Date for display in Colombia timezone */
export function fmtDateTimeCO(d: Date): string {
  return d.toLocaleString("es-CO", {
    timeZone: TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Format a Date as date-only in Colombia timezone */
export function fmtDateCO(d: Date): string {
  return d.toLocaleDateString("es-CO", { timeZone: TZ });
}

/** Get today's date string (YYYY-MM-DD) in Colombia timezone */
export function todayCO(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: TZ });
  // en-CA locale formats as YYYY-MM-DD
}

/** Get tomorrow's date string (YYYY-MM-DD) in Colombia timezone */
export function tomorrowCO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toLocaleDateString("en-CA", { timeZone: TZ });
}
