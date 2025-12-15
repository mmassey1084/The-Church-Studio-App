import { Link, useLocation } from "react-router-dom";

const navItems = [
  {
    to: "/",
    label: "Home",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3 3 10v10h6v-6h6v6h6V10z" />
      </svg>
    ),
  },
  {
    to: "/archive",
    label: "Archive",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 4h18v4H3V4zm2 6h14v10H5V10zm2 2v2h10v-2H7z" />
      </svg>
    ),
  },
  {
    to: "/listen-in",
    label: "Listen In",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3a6 6 0 0 1 6 6v8a3 3 0 0 1-3 3h-1v-8h3V9a5 5 0 0 0-10 0v3h3v8H9a3 3 0 0 1-3-3V9a6 6 0 0 1 6-6z" />
      </svg>
    ),
  },
  {
    to: "/studio-guide",
    label: "Studio Guide",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 4h12a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4V4zm4 4h10v10H8a2 2 0 0 1-2-2V6h2z" />
      </svg>
    ),
  },
  {
    to: "/backstage-pass",
    label: "Backstage",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m12 2 2.9 6.3 6.9.6-5.2 4.6 1.6 6.7L12 17l-6.2 3.2 1.6-6.7L2 8.9l6.9-.6L12 2z" />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const { pathname } = useLocation();

  return (
    <nav
      className="bottom-nav"
      role="navigation"
      aria-label="Primary"
    >
      <div className="bottom-nav-track" aria-label="Swipe to scroll">
        {navItems.map(({ to, label, icon }) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`bottom-nav-item${active ? " active" : ""}`}
              aria-current={active ? "page" : undefined}
            >
              <span className="bottom-nav-icon">{icon}</span>
              <span className="bottom-nav-label">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}


