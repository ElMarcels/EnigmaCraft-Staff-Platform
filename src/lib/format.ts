export function formatInTimezone(
  date: Date | string | null | undefined,
  timezone?: string | null,
  opts: Intl.DateTimeFormatOptions = {}
): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (!timezone) return d.toLocaleString("es-ES", opts);
  try {
    return new Intl.DateTimeFormat("es-ES", {
      timeZone: timezone,
      ...opts,
    }).format(d);
  } catch {
    return d.toLocaleString("es-ES", opts);
  }
}