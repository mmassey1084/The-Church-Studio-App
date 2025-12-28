//WeatherBade.jsx
import React, { useEffect, useState } from "react";

/**
 * Tiny weather pill fetched from Open-Meteo using device geolocation.
 * - Falls back to Tulsa, OK if geolocation is blocked or fails.
 * - Show a compact UI when size="compact".
 *
 * Props:
 *   className?: string
 *   size?: "default" | "compact"
 */
export default function WeatherBadge({ className = "", size = "default" }) {
  const [tempF, setTempF] = useState(null);
  const [code, setCode] = useState(null);
  const [loading, setLoading] = useState(true);

  // Tulsa fallback
  const FALLBACK = { lat: 36.15398, lon: -95.99277 };

  useEffect(() => {
    let cancelled = false;

    function fetchWeather(lat, lon) {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&temperature_unit=fahrenheit&timezone=auto`;
      fetch(url)
        .then((r) => r.json())
        .then((j) => {
          if (cancelled) return;
          const cw = j?.current_weather;
          setTempF(
            typeof cw?.temperature === "number"
              ? Math.round(cw.temperature)
              : null
          );
          setCode(typeof cw?.weathercode === "number" ? cw.weathercode : null);
        })
        .catch(() => {
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }

    // Try geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
        () => fetchWeather(FALLBACK.lat, FALLBACK.lon),
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 120000 }
      );
    } else {
      fetchWeather(FALLBACK.lat, FALLBACK.lon);
    }

    return () => {
      cancelled = true;
    };
  }, []);

  const icon = weatherCodeToIcon(code);
  const label = loading ? "…" : tempF != null ? `${tempF}°F` : "--";

  return (
    <span
      className={`weather-badge ${
        size === "compact" ? "is-compact" : ""
      } ${className}`}
    >
      <span className="wx-ico" aria-hidden="true">
        {icon}
      </span>
      <span className="wx-t">{label}</span>
    </span>
  );
}

/* Very small mapping for Open-Meteo WMO weather codes */
function weatherCodeToIcon(code) {
  if (code == null) return "⏳";
  if ([0].includes(code)) return "☀️"; // clear
  if ([1, 2].includes(code)) return "🌤️"; // mainly clear/partly cloudy
  if ([3].includes(code)) return "☁️"; // overcast
  if ([45, 48].includes(code)) return "🌫️"; // fog
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return "🌧️"; // rain
  if ([56, 57, 66, 67].includes(code)) return "🌧️"; // freezing drizzle/rain (treat as rain)
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "🌨️"; // snow
  if ([95, 96, 99].includes(code)) return "⛈️"; // thunderstorm
  return "🌤️";
}
