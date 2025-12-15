import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Capacitor } from "@capacitor/core";

import homeOfLeon from "../assets/The_Church_Studio,_Home_of_Leon_Russell.jpg";
import teresaImg from "../assets/team/teresa_ceo.jpg";
import stantonImg from "../assets/team/stanton_executive_director.jpg";
import ronnieImg from "../assets/team/ronnie_coo.png";
import lillianaImg from "../assets/team/lilliana_business_office_manager.jpg";
import nancyImg from "../assets/team/nancy_pr_development.jpg";
import ariImg from "../assets/team/ari_marketing.jpg";
import ivanImg from "../assets/team/ivan_property_manager.jpg";
import jessicaImg from "../assets/team/jessica_retial_manager.jpg";
import rohnaImg from "../assets/team/rhona_receptionist.jpg";
import mikeImg from "../assets/team/mike_audio_engineer.jpg";
import lindaImg from "../assets/team/linda_concierge_services.png";
import garyImg from "../assets/team/gary_audio_engineer.jpg";
import kingCabbage from "../assets/kingCabbage.jpeg";
import carousel1 from "../assets/carousel_image.jpg";
import carousel2 from "../assets/the-church-studio_carousel.jpg";
import carousel3 from "../assets/sutdio_carousel.png";
import carousel4 from "../assets/archives_carousel.jpg";
import kristen from "../assets/kristen.jpeg";
import leon1 from "../assets/Leon-Russell-2.jpg";
import leon2 from "../assets/Leon-Russell-5.jpg";
import leonWall from "../assets/leonWall.jpeg";
import TunesNoonLogo from "../assets/Tunes@NoonLogo.png";
import conferenceRoom from "../assets/conferenceRoom.jpeg";
import Church1915 from "../assets/1915_church.jpg";
import before1915 from "../assets/before_1915_church.jpg";
import leon7 from "../assets/Leon-Russell-7.jpg";
import churchNow from "../assets/churchNow.jpg";
import WeatherBadge from "../components/WeatherBadge.jsx";
import Header from "../components/Header.jsx";

import { API_BASE, TZ, getEventsForDay, whoAmI } from "../lib/eventsApi";

/* ---------- Merch (transparent) ---------- */
/* Put the PNGs you downloaded into: src/assets/merch/  */
import merchSweatshirt from "../assets/merch/NavyBlueSweatshirt.png";
import merchCircleTee from "../assets/merch/circleLogoTee.png";
import merchBrownHoodie from "../assets/merch/brownHoodie.png";
import merchWhiteZip from "../assets/merch/WhiteZipHoodie.png";
import merchLeonTee from "../assets/merch/LeonRusselTee.png";
import merchHat1972 from "../assets/merch/1972Cap.png";
import merchBeanie from "../assets/merch/blackBeenie.png";
import merchBook from "../assets/merch/SancOfSound.png";
import merchTumbler from "../assets/merch/BlackYeti.png";
import merchMug from "../assets/merch/whiteMug.png";

/* -------------------------- Config -------------------------- */
const fmtISO = (d) => d.toISOString().slice(0, 10);

const ENV_TOUR = import.meta.env.VITE_MUSEUM_TOUR_URL;
const ORG_SLUG = "the-church-studio";
const FALLBACK_TOUR = `https://www.universe.com/users/${ORG_SLUG}/events?query=museum%20tour`;
const MUSEUM_TOUR_URL =
  ENV_TOUR && ENV_TOUR.startsWith("http") ? ENV_TOUR : FALLBACK_TOUR;

const TUNES_DONATE_URL =
  (import.meta.env.VITE_GIVEBUTTER_TUNES_URL &&
    String(import.meta.env.VITE_GIVEBUTTER_TUNES_URL)) ||
  "https://givebutter.com/duOZoX";

const EVENTS_TTL_MS = 15 * 60 * 1000;

/* -------------------- Tiny Events Cache (SWR) -------------------- */
const mem = new Map();
const eventsCacheKey = (dateISO, tz) => `events:${dateISO}:${tz}`;

function readCachedEvents(dateISO, tz) {
  const key = eventsCacheKey(dateISO, tz);
  const m = mem.get(key);
  if (m && Date.now() - m.ts < EVENTS_TTL_MS) {
    return { events: m.events || [], note: m.note || "", fresh: true };
  }
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { ts, events, note } = JSON.parse(raw);
    const fresh = Date.now() - ts < EVENTS_TTL_MS;
    return {
      events: Array.isArray(events) ? events : [],
      note: note || "",
      fresh,
    };
  } catch {
    return null;
  }
}
function writeCachedEvents(dateISO, tz, payload) {
  const key = eventsCacheKey(dateISO, tz);
  const wrapped = {
    ts: Date.now(),
    events: payload.events || [],
    note: payload.note || "",
  };
  try {
    localStorage.setItem(key, JSON.stringify(wrapped));
  } catch {}
  mem.set(key, wrapped);
}
async function swrLoadEvents({ dateISO, tz, loader, onUpdate }) {
  const fresh = await loader();
  writeCachedEvents(dateISO, tz, fresh);
  onUpdate && onUpdate(fresh);
}

/* ---------------- Helpers for Tunes @ Noon ---------------- */
const isTunesAtNoon = (title = "") =>
  title.toLowerCase().includes("tunes @ noon");
function extractArtist(ev) {
  if (!ev) return "";
  if (ev.tunesArtist) return (ev.tunesArtist || "").trim();
  const desc = (ev.description || "").trim();
  const m = desc.match(/^Performing artist:\s*(.+)$/i);
  return m ? m[1].trim() : "";
}

/* =========================
   Curved (Arc) Carousel
   ========================= */
function CurvedCarousel({ images = [], auto = true, interval = 2800 }) {
  const [active, setActive] = useState(0);
  const n = images.length;
  const timer = useRef(null);

  // autoplay
  useEffect(() => {
    if (!auto || n < 2) return;
    timer.current = setInterval(() => setActive((i) => (i + 1) % n), interval);
    return () => clearInterval(timer.current);
  }, [auto, interval, n]);

  const pause = () => timer.current && clearInterval(timer.current);
  const resume = () => {
    if (!auto || n < 2) return;
    clearInterval(timer.current);
    timer.current = setInterval(() => setActive((i) => (i + 1) % n), interval);
  };

  const prev = () => setActive((i) => (i - 1 + n) % n);
  const next = () => setActive((i) => (i + 1) % n);

  const radius = 220;
  const stepDeg = 14;
  const maxScale = 1.0;
  const minScale = 0.7;

  return (
    <div 
      className="curved-carousel"
      onMouseEnter={pause}
      onMouseLeave={resume}
      onTouchStart={pause}
      onTouchEnd={resume}
    >
      <div className="cc-stage">
        {images.map((src, i) => {
          const offset = i - active;
          const shortest =
            Math.abs(offset) <= n / 2
              ? offset
              : offset > 0
              ? offset - n
              : offset + n;

          const angle = shortest * stepDeg * (Math.PI / 180);
          const x = radius * Math.sin(angle);
          const y = radius * (1 - Math.cos(angle));
          const t = Math.max(0, 1 - Math.abs(shortest) / (n / 2));
          const scale = minScale + (maxScale - minScale) * t;
          const z = 100 - Math.abs(shortest);

          return (
            <button
              key={i}
              className={`cc-item ${i === active ? "is-active" : ""}`}
              style={{
                transform: `translate3d(${x}px, ${y}px, 0) scale(${scale})`,
                zIndex: z,
                opacity: 0.25 + 0.75 * t,
              }}
              onClick={() => setActive(i)}
              aria-label={`Show item ${i + 1}`}
            >
              <img src={src} alt="" className="cc-img" loading="lazy" />
            </button>
          );
        })}
      </div>

      {/* Navigation arrows */}
      <div className="cc-arrows">
        <button className="cc-arrow" onClick={prev} aria-label="Previous item">
          ‹
        </button>
        <button className="cc-arrow" onClick={next} aria-label="Next item">
          ›
        </button>
      </div>
    </div>
  );
}


/** Church Merch card — curved carousel + open button (no iframe) */
function ChurchMerchCard() {
  const STORE_URL = "https://store.thechurchstudio.com";
  const items = [
    merchSweatshirt,
    merchCircleTee,
    merchBrownHoodie,
    merchWhiteZip,
    merchLeonTee,
    merchHat1972,
    merchBeanie,
    merchBook,
    merchTumbler,
    merchMug,
  ];

  async function openStore() {
    if (Capacitor?.isNativePlatform?.()) {
      try {
        const { Browser } = await import("@capacitor/browser");
        await Browser.open({
          url: STORE_URL,
          presentationStyle: "fullscreen",
          toolbarColor: "#658d1b",
        });
        return;
      } catch (e) {
        console.warn("Capacitor Browser open failed; falling back", e);
      }
    }
    window.open(STORE_URL, "_blank", "noopener,noreferrer");
  }

  return (
    <article className="info-card">
      <h3>Church Merch</h3>
      <p className="muted">Browse apparel &amp; gifts — preview below.</p>

      <div className="merch-carousel-wrap">
        <CurvedCarousel images={items} />
      </div>

      <div className="cta-row" style={{ marginTop: 12 }}>
        <button className="btn" onClick={openStore}>
          Open Store
        </button>
      </div>
    </article>
  );
}

/** Artist legends row */
function ArtistLegends() {
  const artists = [
    "Kansas",
    "Dwight Twilley Band",
    "The GAP Band",
    "Willie Nelson",
    "JJ Cale",
    "Tom Petty",
  ];
  return (
    <div className="artist-row" role="list">
      {artists.map((name) => (
        <span
          key={name}
          className="artist-chip"
          role="listitem"
          aria-label={name}
        >
          {name}
        </span>
      ))}
    </div>
  );
}

/** Then/Now slider */
function ThenNowSlider({
  beforeSrc,
  afterSrc,
  beforeAlt = "Then",
  afterAlt = "Now",
}) {
  const overlayRef = useRef(null);
  const rangeRef = useRef(null);
  useEffect(() => {
    const el = overlayRef.current;
    const range = rangeRef.current;
    if (!el || !range) return;
    const update = () => {
      el.style.width = `${Number(range.value)}%`;
    };
    update();
    range.addEventListener("input", update);
    return () => range.removeEventListener("input", update);
  }, []);
  return (
    <div className="then-now">
      <div className="then-now-inner">
        <img src={afterSrc} alt={afterAlt} className="then-now-img" />
        <div className="then-now-overlay" ref={overlayRef}>
          <img src={beforeSrc} alt={beforeAlt} className="then-now-img" />
        </div>
        <input
          ref={rangeRef}
          type="range"
          min="0"
          max="100"
          defaultValue="50"
          className="then-now-slider"
          aria-label="Drag to compare then and now"
        />
        <div className="then-now-labels">
          <span>Then</span>
          <span>Now</span>
        </div>
      </div>
    </div>
  );
}

/** Brief History section (unchanged except “Full Story” removed) */
function HistorySection() {
  const points = [
    {
      year: "1915",
      title: "Grace Methodist Episcopal Church",
      img: before1915,
      body: "Built in 1915 as Grace Methodist Episcopal Church—one of Tulsa’s early congregations—the building withstood the 1921 Tulsa Race Massacre and continued serving the community for decades.",
    },
    {
      year: "1950s",
      title: "Stone Facade",
      img: Church1915,
      body: "In the mid-1950s the distinctive ‘castle’ stone facade replaced the original brick, shaping the iconic exterior you see today.",
    },
    {
      year: "1972",
      title: "Leon Russell purchases",
      img: leon7,
      body: "Leon Russell bought the property in 1972 and transformed it into The Church Studio—creative home base for Shelter Records and a magnet for world-class session players.",
    },
    {
      year: "2022",
      title: "Restoration & Reopening",
      img: churchNow,
      body: "Under owners Teresa Knox & Ivan Acosta, the studio was painstakingly restored and reopened in 2022—now a living recording facility, museum, tour destination, and education space.",
    },
  ];
  const [active, setActive] = useState(0);
  const current = points[active];

  return (
    <section className="section">
      <div className="section-head">
        <h2>A Brief History</h2>
      </div>
      <div
        className="timeline"
        role="tablist"
        aria-label="The Church Studio History"
      >
        {points.map((p, i) => (
          <button
            key={p.year}
            className={`timeline-chip ${i === active ? "active" : ""}`}
            onClick={() => setActive(i)}
            role="tab"
            aria-selected={i === active}
            aria-controls={`history-panel-${i}`}
          >
            {p.year}
          </button>
        ))}
      </div>

      <article
        id={`history-panel-${active}`}
        className="grid-card history-detail"
        role="tabpanel"
        aria-labelledby={points[active]?.year}
      >
        <div className="history-media">
          <img src={current.img} alt={current.title} loading="lazy" />
        </div>
        <div className="history-copy">
          <h3 className="card-title">{current.title}</h3>
          <p className="muted">{current.body}</p>
          <ArtistLegends />
        </div>
      </article>

      <div className="thennow-block">
        <ThenNowSlider
          beforeSrc={carousel2}
          afterSrc={before1915}
          beforeAlt="Historic exterior"
          afterAlt="Restored exterior"
        />
      </div>
    </section>
  );
}

/* ------------------------------ Page ------------------------------ */
export default function Home() {
  const today = useMemo(() => new Date(), []);
  const dateISO = fmtISO(today);

  const [events, setEvents] = useState([]);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [eventsStatus, setEventsStatus] = useState("idle"); // cache | network

  useEffect(() => {
    (async () => {
      try {
        const info = await whoAmI();
        console.log("[Home] whoami:", info, "API_BASE:", API_BASE);
      } catch (e) {
        console.log("[Home] whoami failed:", e?.message || e);
      }
    })();
  }, []);

  useEffect(() => {
    let mounted = true;
    const cached = readCachedEvents(dateISO, TZ);
    if (cached) {
      setEvents(cached.events);
      setNote(cached.note);
      setLoading(false);
      setEventsStatus("cache");
    }
    (async () => {
      try {
        await swrLoadEvents({
          dateISO,
          tz: TZ,
          loader: async () => {
            const data = await getEventsForDay(dateISO, TZ);
            return {
              events: Array.isArray(data.events) ? data.events : [],
              note: typeof data.note === "string" ? data.note : "",
            };
          },
          onUpdate: (fresh) => {
            if (!mounted) return;
            setEvents(fresh.events);
            setNote(fresh.note || "");
            setLoading(false);
            setError("");
            setEventsStatus("network");
          },
        });
      } catch (err) {
        console.warn("[Home] events refresh failed:", err);
        const cached2 = readCachedEvents(dateISO, TZ);
        if (!cached2) {
          setError(err?.message || "Failed to load events");
          setLoading(false);
          setEventsStatus("idle");
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [dateISO]);

  useEffect(() => {
    if (events) writeCachedEvents(dateISO, TZ, { events, note });
  }, [events, note, dateISO]);

  const team = [
    { name: "Teresa", role: "CEO", img: teresaImg },
    { name: "Stanton", role: "Executive Director", img: stantonImg },
    { name: "Ronnie", role: "COO", img: ronnieImg },
    { name: "Lilliana", role: "Business Office Manager", img: lillianaImg },
    { name: "Nancy", role: "PR & Development Director", img: nancyImg },
    { name: "Ari", role: "Marketing", img: ariImg },
    { name: "Ivan", role: "Property Manager", img: ivanImg },
    { name: "Jessica", role: "Retail Manager", img: jessicaImg },
    { name: "Rohna", role: "Receptionist", img: rohnaImg },
    { name: "Mike", role: "Audio Engineer", img: mikeImg },
    { name: "Linda", role: "Concierge Services", img: lindaImg },
    { name: "Gary", role: "Audio Engineer", img: garyImg },
  ];

  return (
    <main className="page home-page">
      <Header />

      {/* HERO */}
      <section className="home-hero hero-fullscreen">
        <div className="hero-top">
          <div className="hero-kicker">
            Current location • Tulsa, OK
            <WeatherBadge className="inline-weather" />
          </div>
          <h1 className="hero-title">Welcome to The Church Studio</h1>

          <div
            id="homeCarousel"
            className="carousel slide carousel-fade"
            data-bs-ride="carousel"
            data-bs-interval="5000"
          >
            <div className="carousel-inner">
              <div className="carousel-item active" data-bs-interval="5000">
                <img
                  src={homeOfLeon}
                  className="d-block w-100 rounded-lg"
                  alt="Church Studio Exterior"
                />
              </div>
              <div className="carousel-item" data-bs-interval="5000">
                <img
                  src={carousel1}
                  className="d-block w-100 rounded-lg"
                  alt="Studio interior"
                />
              </div>
              <div className="carousel-item" data-bs-interval="5000">
                <img
                  src={leonWall}
                  className="d-block w-100 rounded-lg"
                  alt="Wall full of Leon memorabilia such as a guitar"
                />
              </div>
              <div className="carousel-item" data-bs-interval="5000">
                <img
                  src={carousel3}
                  className="d-block w-100 rounded-lg"
                  alt="Recording studio room"
                />
              </div>
              <div className="carousel-item" data-bs-interval="5000">
                <img
                  src={conferenceRoom}
                  className="d-block w-100 rounded-lg"
                  alt="Conference room in the Church Studio"
                />
              </div>
              <div className="carousel-item" data-bs-interval="5000">
                <img
                  src={kingCabbage}
                  className="d-block w-100 rounded-lg"
                  alt="King Cabbage playing in the Church Studio"
                />
              </div>
              <div className="carousel-item" data-bs-interval="5000">
                <img
                  src={kristen}
                  className="d-block w-100 rounded-lg"
                  alt="Kristin Chenoweth at the Church Studio"
                />
              </div>
            </div>

            <button
              className="carousel-control-prev"
              type="button"
              data-bs-target="#homeCarousel"
              data-bs-slide="prev"
            >
              <span className="carousel-control-prev-icon" aria-hidden="true" />
              <span className="visually-hidden">Previous</span>
            </button>
            <button
              className="carousel-control-next"
              type="button"
              data-bs-target="#homeCarousel"
              data-bs-slide="next"
            >
              <span className="carousel-control-next-icon" aria-hidden="true" />
              <span className="visually-hidden">Next</span>
            </button>
          </div>
        </div>

        <h2 style={{ marginTop: "2rem", textAlign: "center" }}>
          Meet the Team
        </h2>
        <div className="oval-gallery team-gallery">
          {team.map((member, i) => (
            <div className="team-member" key={i}>
              <img
                className="oval-thumb"
                src={member.img}
                alt={member.name}
                loading="lazy"
              />
              <div className="team-text">
                <p className="team-name">{member.name}</p>
                <p className="team-role">{member.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* EVENTS / TODAY */}
      <section className="section">
        <div className="section-head">
          <h2>Today</h2>
          <div className="today-meta" aria-live="polite">
            <span className="date">{dateISO}</span>
            {eventsStatus === "cache" && (
              <span className="updated">Showing cached data</span>
            )}
            {eventsStatus === "network" && (
              <span className="updated">Updated just now</span>
            )}
          </div>
        </div>

        {loading && <EventsSkeleton />}
        {error && (
          <p style={{ color: "salmon", whiteSpace: "pre-wrap" }}>
            Error: {error}
          </p>
        )}
        {!loading && !error && note === "no-events-today-fallback-upcoming" && (
          <p className="muted">Showing the next upcoming events.</p>
        )}

        <article className="empty-cta" style={{ marginBottom: 16 }}>
          <div className="empty-copy">
            <h3>Buy Museum Tour Tickets</h3>
            <p>Guided tours run most days. Secure your spot now.</p>
          </div>
          <a
            href={MUSEUM_TOUR_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn"
            aria-label="Buy Museum Tour Tickets (opens in a new tab)"
          >
            Buy Museum Tour Tickets
          </a>
        </article>

        {!loading && !error && events.length === 0 && (
          <article className="grid-card" style={{ padding: 16 }}>
            <h3 style={{ marginTop: 0 }}>No ticketed events today</h3>
            <p className="muted">
              Check back soon—new shows are added regularly.
            </p>
          </article>
        )}

        {events.length > 0 && (
          <div className="cards-row">
            {events.map((ev) => {
              const isTunes = isTunesAtNoon(ev.title || "");

              if (isTunes) {
                // Use the cleaned artist from the backend (set in fetchTunesAtNoonEvents)
                const artist = ev.tunesArtist || "";

                return <TunesAtNoonCard key={ev.id} artistLabel={artist} />;
              }

              // Default card for all non–Tunes @ Noon events
              return (
                <article className="card-large" key={ev.id}>
                  <div className="card-media" />
                  <div className="card-body">
                    <h3 className="card-title">
                      {ev.title}
                      {ev.startsAt && (
                        <span className="time">
                          ·{" "}
                          {new Date(ev.startsAt).toLocaleTimeString([], {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                    </h3>
                    {ev.location && <p className="muted">{ev.location}</p>}
                    <div className="cta-row">
                      {ev.purchaseUrl && (
                        <a
                          href={ev.purchaseUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-small"
                        >
                          Buy Tickets
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* ===== History section ===== */}
      <HistorySection />

      {/* Leon Russell section */}
      <section className="section">
        <div className="section-head">
          <h2>Meet Leon Russell</h2>
        </div>
        <div className="grid-card" style={{ overflow: "hidden", padding: 0 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr)",
              gap: 0,
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
                padding: 12,
              }}
            >
              <div
                style={{
                  borderRadius: 12,
                  overflow: "hidden",
                  border: "1px solid var(--border)",
                  background: "rgba(255,255,255,.03)",
                }}
              >
                <img
                  src={leon1}
                  alt="Leon Russell performing"
                  style={{
                    width: "100%",
                    height: 260,
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              </div>
              <div
                style={{
                  borderRadius: 12,
                  overflow: "hidden",
                  border: "1px solid var(--border)",
                  background: "rgba(255,255,255,.03)",
                }}
              >
                <img
                  src={leon2}
                  alt="Leon Russell at the piano"
                  style={{
                    width: "100%",
                    height: 260,
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              </div>
            </div>

            <div
              className="grid-card"
              style={{ border: 0, borderTop: "1px solid var(--border)" }}
            >
              <p>
                <strong>Leon Russell</strong>, born{" "}
                <em>Claude Russell Bridges</em> in Lawton, Oklahoma on April 2,
                1942, passed away on November 13, 2016. Leon was an
                internationally celebrated American musician and songwriter
                directly involved with hundreds of bestselling pop records
                across a 60-year career. His genres included the Tulsa Sound,
                pop, rock, blues, country, bluegrass, standards, gospel, and
                surf — with six gold records to his credit.
              </p>
              <p>
                He began playing piano at four and attended Will Rogers High
                School in Tulsa, where he performed in clubs under a borrowed ID
                (and the name “Leon”). After moving to Los Angeles in 1958 he
                became an in-demand session pianist with what would later be
                known as <em>The Wrecking Crew</em>, recording with Jan &amp;
                Dean, Herb Alpert, the Beach Boys, and many more. By 1970 he was
                a successful arranger, songwriter, and solo artist — without
                ever letting go of his other roles.
              </p>
              <p>
                Leon recorded 33 albums and at least 430 songs. He wrote “Delta
                Lady” for Joe Cocker and organized Cocker’s legendary{" "}
                <em>Mad Dogs &amp; Englishmen</em> tour. His timeless “A Song
                for You” has been covered by over 100 artists including Amy
                Winehouse, Michael Bublé, the Carpenters, Ray Charles, Willie
                Nelson, Simply Red, and Whitney Houston. On his 1970 debut{" "}
                <em>Leon</em>, he was backed by Eric Clapton, Ringo Starr, and
                George Harrison; Elton John called Leon a mentor and later
                recorded <em>The Union</em> with him (2010).
              </p>
              <p>
                Russell produced and played in sessions for Bob Dylan, Frank
                Sinatra, Ike &amp; Tina Turner, the Rolling Stones, and
                countless others. He wrote and recorded the hits “Tight Rope”
                and “This Masquerade,” performed at the Concert for Bangladesh,
                and was inducted into both the Oklahoma Music Hall of Fame and
                the Rock &amp; Roll Hall of Fame. Leon’s archives are preserved
                by the Oklahoma Historical Society for the forthcoming OKPOP
                Museum; The Church Studio also maintains a dedicated collection
                honoring his life and legacy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* INFO STRIP with Church Merch + tiny map */}
      <section className="section info-strip">
        <ChurchMerchCard />

        <article className="info-card">
          <h3>Backstage Pass</h3>
          <p>Members-only tracks, early drops, and Q&amp;As.</p>
          <Link to="/backstage-pass">
            <button className="btn">Join</button>
          </Link>
        </article>

        <article className="info-card">
          <h3>Visitor Info</h3>
          <p>Open today 10AM–3PM • Walk-ins welcome</p>
          <p>
            <strong>Address:</strong> 304 S Trenton Ave, Tulsa, OK 74120
          </p>
          <p>
            <strong>Phone:</strong>{" "}
            <a href="tel:+19188942965">(918) 894-2965</a>
          </p>
          <p>
            <strong>Email:</strong>{" "}
            <a href="mailto:info@thechurchstudio.com">
              info@thechurchstudio.com
            </a>
          </p>
          <div
            className="cta-row"
            style={{ marginTop: 10, alignItems: "center" }}
          >
            <a
              className="btn-ghost"
              href="https://maps.google.com?q=The+Church+Studio+304+S+Trenton+Ave+Tulsa+OK+74120"
              target="_blank"
              rel="noopener noreferrer"
            >
              Directions
            </a>
            <div className="mini-map">
              <iframe
                title="The Church Studio map"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src="https://www.google.com/maps?q=The+Church+Studio+Tulsa&output=embed"
              />
            </div>
          </div>
        </article>
      </section>
    </main>
  );
}

/* Skeleton for events */
function EventsSkeleton({ count = 3 }) {
  return (
    <div className="cards-row" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <article className="card-large skeleton-card" key={i}>
          <div className="card-media skeleton-block" />
          <div className="card-body">
            <div className="skeleton-line skeleton-line-lg" />
            <div className="skeleton-line" />
            <div className="skeleton-pill" />
          </div>
        </article>
      ))}
    </div>
  );
}

/* Tunes @ Noon */
function TunesAtNoonCard({ artistLabel = "" }) {
  return (
    <article className="card-large">
      <div className="card-media tunes-card-media">
        <img
          src={TunesNoonLogo}
          alt="Tunes @ Noon"
          className="tunes-card-img"
          loading="lazy"
        />
      </div>

      <div className="card-body">
        <h3 className="card-title">
          Tunes @ Noon{" "}
          {artistLabel ? (
            <span className="time">• Artist: {artistLabel}</span>
          ) : null}
        </h3>

        <div className="cta-row">
          <a className="btn btn-small" href="/studio-guide#tunes-noon">
            Learn More
          </a>
          <a
            className="btn btn-small"
            href={TUNES_DONATE_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Buy Tickets
          </a>
        </div>
      </div>
    </article>
  );
}
