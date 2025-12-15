import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Link } from "react-router-dom";
import TopMenuLogo from "../assets/topMenuLogo.png";
import FacebookLogo from "../assets/facebook.png";
import TwitterLogo from "../assets/twitter.png";
import InstagramLogo from "../assets/instagram.png";
import ChurchPlaq from "../assets/Church_Plaq.png";
import WeatherBadge from "../components/WeatherBadge.jsx";

export default function MenuOverlay({ onClose }) {
  const panelRef = useRef(null);
  const location = useLocation();
  const currentPath = location.pathname;

  // disable background scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const stop = (e) => e.stopPropagation();

  // Menu items with path + label
  const menuItems = [
    { path: "/", label: "HOME" },
    { path: "/virtual-tour", label: "VIRTUAL TOUR" },
    { path: "/events", label: "EVENTS" },
    { path: "/archive", label: "ARCHIVE" },
    { path: "/listen-in", label: "LISTEN IN" },
    { path: "/studio-guide", label: "STUDIO GUIDE" },
    {
      path: "https://store.thechurchstudio.com/",
      label: "CHURCH MERCH",
      external: true,
    },
    { path: "/backstage-pass", label: "BACKSTAGE PASS" },
  ];

  // Filter out current page
  const visibleItems = menuItems.filter((item) => item.path !== currentPath);

  return (
    <div
      id="menu-overlay"
      className="overlay-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <nav
        className="overlay-panel"
        ref={panelRef}
        onClick={stop}
        aria-label="Main menu"
        id="overlay-panel"
      >
        {/* Top bar: logo left, weather right */}
        <div
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            marginBottom: "10px",
          }}
        >
          <img
            src={TopMenuLogo}
            id="topMenuLogo"
            alt="Church Studio secondary logo"
          />
          <WeatherBadge size="compact" />
        </div>

        <ul className="overlay-list">
          {visibleItems.map((item) =>
            item.external ? (
              <li key={item.label}>
                <a
                  href={item.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="menu-overlay-items"
                >
                  {item.label}
                </a>
              </li>
            ) : (
              <li key={item.label}>
                <Link
                  to={item.path}
                  className="menu-overlay-items"
                  onClick={onClose}
                >
                  {item.label}
                </Link>
              </li>
            )
          )}
        </ul>

        <div className="overlay-social">
          <a
            href="https://www.facebook.com/TheChurchStudio/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img src={FacebookLogo} alt="Facebook" />
          </a>
          <a
            href="https://x.com/TheChurchStudio"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img src={TwitterLogo} alt="X (Twitter)" />
          </a>
          <a
            href="https://www.instagram.com/thechurchstudio/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img src={InstagramLogo} alt="Instagram" />
          </a>
        </div>

        <img
          id="churchPlaq"
          src={ChurchPlaq}
          alt="Plaque outside The Church Studio"
        />
      </nav>
    </div>
  );
}
