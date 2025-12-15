//Archive.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

// Hero / gallery images
import archiveHero from "../assets/studio_archive__carousel.jpg";
import archiveAlt from "../assets/studio_archive_carousel_2.jpg";
import leonRusselTickets from "../assets/2025-01-22 - PhilClarkinHR-80.jpg";
import leonRusselRecord from "../assets/2025-01-23 - PhilClarkinHR-45.jpg";

export default function Archive() {
  // --- Lightbox state ---
  const [lightboxSrc, setLightboxSrc] = useState(null);

  // Close on ESC
  useEffect(() => {
    if (!lightboxSrc) return;
    const onKey = (e) => e.key === "Escape" && setLightboxSrc(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxSrc]);

  // Prevent background scroll when open
  useEffect(() => {
    if (!lightboxSrc) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [lightboxSrc]);

  return (
    <motion.main
      className="page archive-page"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.24, ease: "easeOut" }}
    >
      {/* HERO */}
      <motion.section
        className="archive-hero"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(0,0,0,.55), rgba(0,0,0,.8)), url(${archiveHero})`,
        }}
        initial={{ opacity: 0.8 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="hero-top">
          <div className="hero-kicker">
            Preservation • Research • Tulsa Sound
          </div>
          <h1 className="hero-title">The Church Studio Archive</h1>
          <p className="muted" style={{ maxWidth: 72 + "ch" }}>
            A rare collection of{" "}
            <strong>
              5,000+ artifacts, documents, recordings, and memorabilia
            </strong>
            associated with Leon Russell, Shelter Records, Tulsa Sound
            musicians, and The Church Studio.
          </p>

          <div className="cta-row" style={{ marginTop: 6 }}>
            <Link to="/backstage-pass" className="btn">
              Become a Member
            </Link>
            <a
              className="btn-ghost"
              href="mailto:info@thechurchstudio.com?subject=Archive%20Research%20Request"
            >
              Research Request
            </a>
          </div>
        </div>
      </motion.section>

      {/* QUICK PHOTO STRIP (clickable → lightbox) */}
      <section className="section">
        <div className="cards-row">
          {[archiveHero, archiveAlt, leonRusselTickets, leonRusselRecord].map(
            (src, idx) => (
              <button
                type="button"
                className="card-large"
                key={idx}
                onClick={() => setLightboxSrc(src)}
                style={{
                  border: "none",
                  padding: 0,
                  cursor: "zoom-in",
                  overflow: "hidden",
                }}
                aria-label="Open photo full size"
              >
                <img
                  src={src}
                  alt={
                    idx === 0
                      ? "Climate-controlled stacks at The Church Studio Archive"
                      : idx === 1
                      ? "Archive workspace and flat files"
                      : idx === 2
                      ? "Leon Russell tickets from different concerts"
                      : "Leon Russell 'Leon Live' record"
                  }
                  className="d-block w-100"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              </button>
            )
          )}
        </div>
      </section>

      {/* ABOUT / ACCESS / WHO USES IT */}
      <section className="section">
        <div className="grid">
          <motion.article
            className="grid-card"
            initial={{ opacity: 0, y: 6 }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <h2>About the Archive</h2>
            <p>
              Located inside the historic Church Studio, the Archive preserves
              primary materials documenting the people, places, and recordings
              that shaped the Tulsa Sound. The collection is carefully housed in
              a climate-controlled environment and maintained using museum best
              practices.
            </p>
            <ul className="sg-amenities" style={{ marginTop: 10 }}>
              <li>5,000+ items described</li>
              <li>1960s → Present coverage</li>
              <li>Climate-controlled storage</li>
              <li>On-site reference access</li>
            </ul>
          </motion.article>

          <motion.article
            className="grid-card"
            initial={{ opacity: 0, y: 6 }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <h2>Access & Policies</h2>
            <ul style={{ marginTop: 0 }}>
              <li>
                <strong>By appointment only</strong> (limited capacity).
              </li>
              <li>
                Requests prioritized for research, publication, and production.
              </li>
              <li>Reading-room use; materials do not circulate offsite.</li>
              <li>No food/drink; pencils only; gloves provided when needed.</li>
              <li>Non-flash photography for reference may be permitted.</li>
              <li>Reproductions &amp; licensing available on request.</li>
            </ul>
          </motion.article>

          <motion.article
            className="grid-card"
            initial={{ opacity: 0, y: 6 }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <h2>Who Uses the Archive?</h2>
            <p>
              Historians, journalists, producers, authors, museums, educators,
              students, and musicians researching the legacy of Leon Russell,
              Shelter Records, and The Church Studio.
            </p>
            <div className="sg-inline-cta">
              <a
                className="btn"
                href="mailto:info@thechurchstudio.com?subject=Archive%20Appointment%20Inquiry"
              >
                Ask About an Appointment
              </a>
              <a className="btn-ghost" href="mailto:info@thechurchstudio.com">
                info@thechurchstudio.com
              </a>
            </div>
          </motion.article>
        </div>
      </section>

      {/* PLAN YOUR VISIT */}
      <section className="section">
        <div className="section-head">
          <h2>Plan Your Visit</h2>
          <span className="muted">Tulsa, OK • By appointment</span>
        </div>

        <div className="grid">
          {[
            {
              t: "1) Send a Research Request",
              p: "Email a short description of your project, dates you’re hoping to visit, and any known item references. Our team will review availability and reply with next steps.",
            },
            {
              t: "2) Confirm Date & Guidelines",
              p: "We’ll reserve time in the reading room and share handling guidelines. Certain material may require staff handling or advance preparation.",
            },
            {
              t: "3) Day-of Details",
              p: "Please bring a photo ID. Check in at the front desk. Lockers are provided for bags and cases. Photography and duplication policies will be explained on arrival.",
            },
          ].map((card, i) => (
            <motion.article
              key={i}
              className="grid-card"
              initial={{ opacity: 0, y: 6 }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <h3 className="sg-card-title">{card.t}</h3>
              <p>{card.p}</p>
            </motion.article>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="section">
        <h2>FAQ</h2>
        <details className="grid-card sg-accordion">
          <summary className="sg-acc-summary">
            <span className="chev">▸</span> Can I see a catalog online?
          </summary>
          <div className="sg-acc-body">
            <p>
              A public finding aid is in development. In the meantime, email us
              with your topic and we’ll check internal inventories for relevant
              materials.
            </p>
          </div>
        </details>

        <details className="grid-card sg-accordion">
          <summary className="sg-acc-summary">
            <span className="chev">▸</span> Do members get special access?
          </summary>
          <div className="sg-acc-body">
            <p>
              Members help sustain preservation. While research access is by
              appointment, members may be invited to special archive previews
              and talks.
            </p>
            <Link to="/backstage-pass" className="btn" style={{ marginTop: 8 }}>
              Join Backstage Pass
            </Link>
          </div>
        </details>
      </section>

      {/* SUPPORT / CONTACT */}
      <section className="section">
        <article className="grid-card">
          <h2>Support the Archive</h2>
          <p>
            Your tax-deductible gift helps conserve fragile materials, digitize
            audio and images, and expand public access for the next generation
            of researchers.
          </p>
          <div className="cta-row">
            {/* ✅ Updated to your Givebutter link */}
            <a
              className="btn"
              href="https://givebutter.com/JPVnUN"
              target="_blank"
              rel="noreferrer"
            >
              Donate / Sponsor
            </a>
            <a className="btn-ghost" href="mailto:info@thechurchstudio.com">
              Contact Us
            </a>
          </div>
        </article>
      </section>

      {/* ----- LIGHTBOX OVERLAY ----- */}
      <AnimatePresence>
        {lightboxSrc && (
          <motion.div
            role="dialog"
            aria-modal="true"
            onClick={() => setLightboxSrc(null)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 99999,
              background: "rgba(0,0,0,.86)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "24px",
              backdropFilter: "blur(2px)",
            }}
          >
            {/* Stop click-through on the image container */}
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.98, y: 6, opacity: 0.9 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.98, y: -6, opacity: 0 }}
              transition={{ duration: 0.18 }}
              style={{
                position: "relative",
                width: "70vw",
                maxWidth: "1000px",
                maxHeight: "90vh",
                borderRadius: "16px",
                overflow: "hidden",
                boxShadow: "0 20px 60px rgba(0,0,0,.5)",
              }}
            >
              {/* Close (top-left of photo) */}
              <button
                onClick={() => setLightboxSrc(null)}
                aria-label="Close"
                className="btn-ghost"
                style={{
                  position: "absolute",
                  top: 8,
                  left: 8,
                  zIndex: 2,
                  background: "rgba(0,0,0,.55)",
                  border: "1px solid rgba(255,255,255,.25)",
                  color: "#fff",
                  fontWeight: 700,
                  borderRadius: 999,
                  width: 40,
                  height: 40,
                  lineHeight: "38px",
                  textAlign: "center",
                  cursor: "pointer",
                  backdropFilter: "blur(6px)",
                }}
              >
                ×
              </button>

              <img
                src={lightboxSrc}
                alt="Archive preview"
                style={{
                  display: "block",
                  width: "100%",
                  height: "auto",
                  maxHeight: "90vh",
                  objectFit: "contain",
                  background: "rgba(255,255,255,.02)",
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.main>
  );
}
