import { useEffect, useMemo, useState } from "react";
import type { UiEvent } from "../lib/eventsApi";
import { getEventsForDay, TZ as DEFAULT_TZ } from "../lib/eventsApi";

/** Format a Date to YYYY-MM-DD */
const fmtISO = (d: Date) => d.toISOString().slice(0, 10);

/**
 * Reusable hook for events (fetches “today” if dateISO is undefined)
 * @param dateISO YYYY-MM-DD string (optional)
 * @param tz IANA timezone (defaults to "America/Chicago")
 */
export function useEventsForDay(
  dateISO?: string,
  tz: string = DEFAULT_TZ
): {
  loading: boolean;
  error: string;
  events: UiEvent[];
  note: string;
} {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [events, setEvents] = useState<UiEvent[]>([]);
  const [note, setNote] = useState("");

  // Compute “today” once per mount to avoid midnight re-renders changing the key
  const todayISO = useMemo(() => fmtISO(new Date()), []);
  const effectiveDate = dateISO ?? todayISO;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError("");
        setEvents([]);
        setNote("");

        const data = await getEventsForDay(effectiveDate, tz);

        if (!cancelled) {
          setEvents(Array.isArray(data.events) ? data.events : []);
          setNote(typeof data.note === "string" ? data.note : "");
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load events");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [effectiveDate, tz]);

  return { loading, error, events, note };
}
