// src/pages/StudioGuide.jsx
import React from "react";
import { Link } from "react-router-dom";
import philClarkinHR from "../assets/2025-01-24 - PhilClarkinHR-65.jpg";
import philClarkinHR67 from "../assets/2025-01-24 - PhilClarkinHR-67.jpg";
import philClarkinHR73 from "../assets/2025-01-24 - PhilClarkinHR-73.jpg";

/** Tiny, accessible accordion (kept) */
function Accordion({ title, children, defaultOpen = false }) {
  return (
    <details className="grid-card sg-accordion" open={defaultOpen}>
      <summary className="sg-acc-summary">
        <span aria-hidden className="chev">
          ▸
        </span>
        {title}
      </summary>
      <div className="sg-acc-body">{children}</div>
    </details>
  );
}

export default function StudioGuide() {
  return (
    <main className="page studio-guide">
      {/* HERO */}
      <section className="sg-hero">
        <div className="sg-hero-inner">
          <p className="sg-eyebrow">Plan your visit</p>
          <h1 className="sg-title">Studio Guide</h1>
          <p className="sg-sub">
            Explore the museum, book tours, and see what’s included when you
            visit The Church Studio.
          </p>

          <div className="sg-hero-cta">
            <Link to="/backstage-pass" className="btn">
              Join Backstage Pass
            </Link>
            <a className="btn-ghost" href="mailto:info@thechurchstudio.com">
              Contact Us
            </a>
          </div>
        </div>
      </section>

      {/* ADMISSION / TOURS */}
      <section className="section sg-section">
        <header className="sg-section-head">
          <h2>🎟️ Admission & Tours</h2>
          <span className="muted">Walk-ins welcome · Docents on standby</span>
        </header>

        <div className="sg-grid-3">
          <article className="sg-card sg-pricecard">
            <h3 className="sg-card-title">General</h3>
            <ul className="sg-price-list">
              <li>
                <span>General Admission</span>
                <strong>$15</strong>
              </li>
              <li>
                <span>Members + 1</span>
                <strong>FREE</strong>
              </li>
              <li>
                <span>Children 5 & under</span>
                <strong>FREE</strong>
              </li>
            </ul>
            <p className="muted">Gallery hours 10AM–3PM · Closed Sundays</p>
          </article>

          <article className="sg-card sg-pricecard">
            <h3 className="sg-card-title">Discounts</h3>
            <ul className="sg-price-list">
              <li>
                <span>Seniors 65+</span>
                <strong>$12</strong>
              </li>
              <li>
                <span>Veterans</span>
                <strong>$12</strong>
              </li>
              <li>
                <span>Students</span>
                <strong>$12</strong>
              </li>
            </ul>
            <p className="muted">Please bring a valid ID.</p>
          </article>

          <article className="sg-card sg-pricecard">
            <h3 className="sg-card-title">Tours</h3>
            <ul className="sg-price-list">
              <li>
                <span>Private Tour</span>
                <strong>$25</strong>
              </li>
            </ul>
            <p className="muted">
              Reserve in advance or email us to schedule group tours.
            </p>
          </article>
        </div>

        <div className="sg-inline-cta">
          <p className="muted">
            Members get unlimited admission, early ticket access, and more.
          </p>
          <Link to="/backstage-pass" className="btn">
            Membership Details
          </Link>
        </div>
      </section>

      {/* QUICK INFO */}
      <section className="section sg-section">
        <header className="sg-section-head">
          <h2>ℹ️ Visitor Info</h2>
        </header>

        <div className="sg-grid-3">
          <article className="sg-card">
            <h3 className="sg-card-title">Hours</h3>
            <p>Open today 10AM–3PM</p>
            <p className="muted">Docents available most days.</p>
          </article>

          <article className="sg-card">
            <h3 className="sg-card-title">Find Us</h3>
            <p>304 S Trenton Ave, Tulsa, OK 74120</p>
            <a
              className="btn-ghost"
              href="https://maps.google.com?q=The+Church+Studio+304+S+Trenton+Ave+Tulsa+OK+74120"
              target="_blank"
              rel="noreferrer"
            >
              Directions
            </a>
          </article>

          <article className="sg-card">
            <h3 className="sg-card-title">Contact</h3>
            <p>
              <a href="tel:+19188942965">(918) 894-2965</a>
            </p>
            <p>
              <a href="mailto:info@thechurchstudio.com">
                info@thechurchstudio.com
              </a>
            </p>
          </article>
        </div>
      </section>

      {/* AMENITIES */}
      <section className="section sg-section">
        <header className="sg-section-head">
          <h2>🏛️ Amenities</h2>
        </header>

        <ul className="sg-amenities">
          <li>🅿️ On-site Parking</li>
          <li>♿ ADA Compliant</li>
          <li>📶 Free Wi-Fi</li>
          <li>🧑‍🍳 Catering Kitchen</li>
          <li>🚻 Public Restrooms</li>
          <li>🏡 Duets BnB Suite</li>
          <li>🏨 Harwelden Mansion Suite</li>
          <li>🌳 Indoor & Outdoor Options</li>
          <li>👥 Up to 100 Guests</li>
          <li>🕒 Up to 8 Hours</li>
        </ul>
      </section>

      {/* VENUE RENTALS */}
      <section className="section sg-section">
        <header className="sg-section-head">
          <h2>🎤 Venue Rentals</h2>
          <span className="muted">
            Ask about docents, music, or small bites.
          </span>
        </header>

        <div className="sg-grid-3">
          <article className="sg-card sg-pricecard">
            <h3 className="sg-card-title">Full Venue</h3>
            <ul className="sg-price-list">
              <li>
                <span>Entire Church Studio</span>
                <strong>$10,000</strong>
              </li>
              <li>
                <span>Gallery Level & Courtyard</span>
                <strong>$7,000</strong>
              </li>
            </ul>
          </article>

          <article className="sg-card sg-pricecard">
            <h3 className="sg-card-title">Space / Hour</h3>
            <ul className="sg-price-list">
              <li>
                <span>Lower Level</span>
                <strong>$1,000</strong>
              </li>
              <li>
                <span>Courtyard</span>
                <strong>$500</strong>
              </li>
              <li>
                <span>Magnolia Meadows</span>
                <strong>$500</strong>
              </li>
            </ul>
          </article>

          <article className="sg-card sg-pricecard">
            <h3 className="sg-card-title">Photoshoots</h3>
            <ul className="sg-price-list">
              <li>
                <span>Interior / hour</span>
                <strong>$100</strong>
              </li>
              <li>
                <span>Exterior / hour</span>
                <strong>$25</strong>
              </li>
            </ul>
          </article>
        </div>

        <article className="sg-card sg-booking">
          <div>
            <h3 className="sg-card-title">Booking</h3>
            <p>Rates, engineers, and lockouts. Contact us for availability.</p>
          </div>
          <a className="btn" href="mailto:info@thechurchstudio.com">
            Request a Quote
          </a>
        </article>
      </section>

      {/* GEAR LIST (accordion – preserved) */}
      <section className="section sg-section">
        <header className="sg-section-head">
          <h2>🎚️ Studio Gear List</h2>
          <span className="muted">Tap to expand any section.</span>
        </header>
        <div
          id="homeCarousel"
          className="carousel slide carousel-fade"
          data-bs-ride="carousel"
          data-bs-interval="5000"
        >
          <div className="carousel-inner">
            <div className="carousel-item active" data-bs-interval="5000">
              <img
                src={philClarkinHR}
                className="d-block w-100 rounded-lg"
                alt="Phil Clarkin HR-65"
              />
            </div>
            <div className="carousel-item" data-bs-interval="5000">
              <img
                src={philClarkinHR67}
                className="d-block w-100 rounded-lg"
                alt="Phil Clarkin HR-67"
              />
            </div>
            <div className="carousel-item" data-bs-interval="5000">
              <img
                src={philClarkinHR73}
                className="d-block w-100 rounded-lg"
                alt="Phil Clarkin HR-73"
              />
            </div>
          </div>

          <button
            className="carousel-control-prev"
            type="button"
            data-bs-target="#homeCarousel"
            data-bs-slide="prev"
          >
            <span
              className="carousel-control-prev-icon"
              aria-hidden="true"
            ></span>
            <span className="visually-hidden">Previous</span>
          </button>

          <button
            className="carousel-control-next"
            type="button"
            data-bs-target="#homeCarousel"
            data-bs-slide="next"
          >
            <span
              className="carousel-control-next-icon"
              aria-hidden="true"
            ></span>
            <span className="visually-hidden">Next</span>
          </button>
        </div>
        <div className="sg-acc-grid">
          <Accordion title="Console, Power & Recorders">
            <ul>
              <li>Neve 8068</li>
              <li>Flying Faders II</li>
              <li>EQUI=TECH BALANCED TECHNICAL POWER</li>
              <li>
                Studer A 827 Gold Edition 2” 24 Track Analog w/ Timeline Lynx-2
              </li>
              <li>ProTools HDX • Ultimate 2021.6</li>
              <li>(2) Burl B80 Motherships</li>
              <li>32 A/D • 40 D/A • BAES-4</li>
              <li>Mac Pro 2.7GHz 7,1 24 Core</li>
              <li>1TB SSD System Drive</li>
              <li>2 2TB SSD Internal Work Drives</li>
              <li>288 GB 2933 MHz DDR4</li>
              <li>Super Drive</li>
              <li>MacOS Monterey 12.0.1</li>
              <li>Ampex ATR-102 1/2″ 2 Track Analog</li>
              <li>Alesis MasterLink ML 9600 24/96</li>
              <li>Brainstorm Distripalyzer SR 112 / SR TCG</li>
              <li>Horita BSG 50 Blackburst</li>
              <li>DK Metering MSD 600</li>
            </ul>
          </Accordion>

          <Accordion title="Headphone System">
            <ul>
              <li>(13) Formula Sound Que 10 Boxes</li>
              <li>(49) CLHR Passive Four Channel Boxes</li>
            </ul>
          </Accordion>

          <Accordion title="Headphones">
            <ul>
              <li>(12) Ultrasone Pro 550i</li>
              <li>(20) Audio Technica ATH-MX50x</li>
            </ul>
          </Accordion>

          <Accordion title="Microphones">
            <p>AKG &amp; Neumann Maintained By The Mic Shop</p>
            <ul>
              <li>(2) AEA KU4</li>
              <li>(2) AKG C12 SM204/23</li>
              <li>(1) AKG C24 Stereo</li>
              <li>(2) AKG C414 EB</li>
              <li>(4) AKG C414 XLS</li>
              <li>(1) AKG C451 E</li>
              <li>(1) AKG D12 E</li>
              <li>(1) AKG D112</li>
              <li>(3) Beyer M160</li>
              <li>(2) Coles 4038</li>
              <li>(4) Electro-Voice ND46</li>
              <li>(2) Electro-Voice RE20</li>
              <li>(2) Gefell M300 Matched Pair</li>
              <li>(2) Neumann KM56</li>
              <li>(2) Neumann KM84</li>
              <li>(1) Neumann M367</li>
              <li>(2) Neumann M49</li>
              <li>(1) Neumann SM2 Stereo</li>
              <li>(1) Neumann SM69 Stereo</li>
              <li>(1) Neumann U47</li>
              <li>(2) Neumann U67</li>
              <li>(4) Neumann U87</li>
              <li>(3) Royer R-122 MKII Ribbon</li>
              <li>(4) Sennheiser MD 421-II</li>
              <li>(1) Sennheiser MD 441-U</li>
              <li>(2) Soyuz 013 FET</li>
              <li>(6) Shure SM57</li>
              <li>(2) Shure SM58</li>
              <li>(3) Shure SM7b</li>
              <li>(1) Telefunken ELAM 251</li>
              <li>(2) Telefunken M80</li>
            </ul>
          </Accordion>

          <Accordion title="Mic Preamps / Channel Strips">
            <ul>
              <li>(2) API 512C</li>
              <li>(1) GML 8304 (4) Channel</li>
              <li>(1) John Hardy M1 (4) Channel</li>
              <li>(2) Telefunken v76</li>
            </ul>
          </Accordion>

          <Accordion title="DIs">
            <ul>
              <li>(1) Acme Audio Motown DI WB-3</li>
              <li>(4) Countryman Type 85</li>
              <li>(1) Demeter VTDB Tube</li>
              <li>(2) Radial JDI MKIII</li>
              <li>(2) Radial JDV MKV</li>
              <li>(1) Radial Pro AV 2</li>
              <li>(1) Radial JPC</li>
              <li>(1) Rupert Neve Designs RNDI-Stereo</li>
            </ul>
          </Accordion>

          <Accordion title="Limiters / Compressors">
            <ul>
              <li>(2) DBX 160 VU</li>
              <li>(3) DBX 160X</li>
              <li>(2) Neve 32264a</li>
              <li>(2) Q2 Audio Compex F765-SP</li>
              <li>(1) Teletronics LA-2A</li>
              <li>(1) Trident 2 Channel</li>
              <li>(1) UREI 1178 2 Channel</li>
              <li>(2) UREI 1176</li>
            </ul>
          </Accordion>

          <Accordion title="Equalizers">
            <ul>
              <li>(2) API 550A</li>
              <li>(2) Great River / Harrison 32</li>
              <li>(2) Maag Audio EQ4</li>
              <li>(1) Orban 622B 2 Channel</li>
              <li>(1) Sontec MEP250 EX 2 Channel</li>
              <li>(2) Trident 80B 500</li>
              <li>(2) Pultec EQP-1</li>
            </ul>
          </Accordion>

          <Accordion title="Reverbs &amp; Delays">
            <ul>
              <li>(1) AMS RMX-16</li>
              <li>(2) EMT 140 Plate Reverb ~ Stereo</li>
              <li>(1) Lexicon 480L w/ Classic Cart</li>
              <li>(1) Lexicon PCM 42</li>
              <li>(2) Live Chambers</li>
            </ul>
          </Accordion>

          <Accordion title="A/D ~ D/A Converters">
            <ul>
              <li>Burl B2 A/D &amp; D/A 2 Channel</li>
            </ul>
          </Accordion>

          <Accordion title="Monitoring — Front Wall">
            <ul>
              <li>Steve Durr Designs</li>
              <li>TAD 1601B Woofers</li>
              <li>TAD 4002 HF Drivers</li>
              <li>Bag End 18” Sub Woofers</li>
              <li>2 Bryston 7B3’s LF</li>
              <li>2 Bryston 7B3’s Subs</li>
              <li>1 Bryston 4B3 HF</li>
            </ul>
          </Accordion>

          <Accordion title="Monitoring — Midfields">
            <ul>
              <li>ATC Loudspeakers SCM50ASL</li>
            </ul>
          </Accordion>

          <Accordion title="Monitoring — Nearfields">
            <ul>
              <li>Yamaha NS-10M Studio</li>
              <li>Bryston 4B3</li>
            </ul>
          </Accordion>

          <Accordion title="Monitoring — Studio">
            <ul>
              <li>Altec A7 Voice Of The Theatre</li>
              <li>Bryston 4B3</li>
              <li>Bag End 18” Sub Woofer</li>
              <li>Bryston 7B3</li>
            </ul>
          </Accordion>

          <Accordion title="Mic Stands">
            <ul>
              <li>(3) Triad-Orbit Mini TM • OM Mini Boom w/ M2 Short Stem</li>
              <li>(6) Triad-Orbit TM-1 • OM Mini Boom w/ M2 Short Stem</li>
              <li>(8) Triad-Orbit T-2 • 01-L Boom w/ M2 Short Stem</li>
              <li>(6) Triad-Orbit T-3C • 01-L Boom w/ M2 Short Stem</li>
              <li>(6) Triad-Orbit Starbird SB-1</li>
              <li>(2) Triad-Orbit 02 X Dual Arm Boom</li>
              <li>(2) Triad-Orbit 02-XY Dual Arm Body</li>
              <li>(1) Triad-Orbit IO Vector Utility Bar</li>
            </ul>
          </Accordion>

          <Accordion title="Instruments">
            <ul>
              <li>Yamaha C7 Conservatory Grand</li>
              <li>Hammond B3 w/ Leslie 122</li>
              <li>Fender Rhodes 73</li>
              <li>Wurlitzer 200A</li>
              <li>Hohner Clavinet D6</li>
            </ul>
          </Accordion>
        </div>
      </section>
    </main>
  );
}
