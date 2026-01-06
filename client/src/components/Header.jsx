// src/components/Header.jsx
import hero from "../assets/New_Logo.png";
import navicon from "../assets/navicon.png";
import { useState } from "react";
import MenuOverlay from "./MenuOverlay";

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header id="header-flex-container" className="header">
      <div className="header-left">
        <img
          src={navicon}
          alt="Open menu"
          id="navicon"
          onClick={() => setOpen(true)}
          style={{ cursor: "pointer" }}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls="menu-overlay"
        />
      </div>

      <img src={hero} id="mainLogo" alt="The Church Studio logo" />

      <div className="header-right">

        <a
          href="https://givebutter.com/JPVnUN"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Donate via Givebutter"
          className="btn btn-primary"
        >
          DONATE
        </a>
      </div>

      {open && <MenuOverlay onClose={() => setOpen(false)} />}
    </header>
  );
}
