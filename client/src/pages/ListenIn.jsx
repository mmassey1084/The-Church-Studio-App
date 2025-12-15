// src/pages/ListenIn.jsx
import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

/* ---------- Mood Player embeds ---------- */
const SPOTIFY_EMBED =
  "https://open.spotify.com/embed/artist/4b7zHpdZFwNAUrFyLyEsaO?utm_source=generator";
const APPLE_MUSIC_EMBED =
  "https://embed.music.apple.com/us/artist/the-church-studio/1827062558";
const AMAZON_MUSIC_EMBED =
  "https://music.amazon.com/embed/B096K1L3YV/?id=xOqHBBAECR&marketplaceId=ATVPDKIKX0DER&musicTerritory=US";
const YTM_UPLOADS_PLAYLIST = "UUhz6deBOywzf-56HMJl_bHA";
const YTM_EMBED = `https://www.youtube.com/embed/videoseries?list=${YTM_UPLOADS_PLAYLIST}`;

export default function ListenIn() {
  /* ---------- Mood Player ---------- */
  const MOODS = useMemo(
    () => ({
      apple: { label: "Apple Music", embed: APPLE_MUSIC_EMBED },
      spotify: { label: "Spotify", embed: SPOTIFY_EMBED },
      youtube: { label: "YouTube", embed: YTM_EMBED },
      amazon: { label: "Amazon Music", embed: AMAZON_MUSIC_EMBED },
    }),
    []
  );

  const [activeMood, setActiveMood] = useState(
    () => localStorage.getItem("listen-in-service") || "apple"
  );
  useEffect(() => {
    localStorage.setItem("listen-in-service", activeMood);
  }, [activeMood]);

  /* ---------- Clients (A–Z) ---------- */
  const CLIENTS = {
    A: [
      "Aaron Patrick",
      "Air Supply",
      "Afroman",
      "Al Jackson, Jr.",
      "Alec Rogerson",
      "Andy Di Martino",
      "Andy Newmark",
      "Andrea Von Kampen",
      "Angelina Jolie",
      "Ann Bell",
      "Arigon Star",
      "Asleep At The Wheel",
      "Aston “Family Man” Barrett",
      "Austin Allsup",
    ],
    B: [
      "Ben Ferrell",
      "Beverly Williams",
      "Bill Champlin",
      "Bill Davis Quartet",
      "Bill Hearn",
      "Bill Ward",
      "Black Crown",
      "Black Grass",
      "Blaine Bailey",
      "Bob Marley",
      "Bob Seger",
      "Bobby Cervantes",
      "Bobby Manuel",
      "Bonnie Hearn",
      "Bonnie Raitt",
      "Brad Absher",
      "Brandon Post",
      "Brenda Maier",
      "Brent Giddens",
      "Brian Hanson",
      "Broncko",
      "Brooke Kemp",
      "Brother Johns",
      "Bryd Brothers",
      "Buddy Jones",
      "Buz Clifford",
      "B.W. Stevenson",
    ],
    C: [
      "Caleb Wheeler",
      "Calhoun",
      "Carla Gregory",
      "Carli Lewis",
      "Carl Phillips",
      "Carlton Pearson",
      "Carol Johnson",
      "Casey Van Beek",
      "Cathy Venable",
      "Cedric Smith",
      "Chad Hailey",
      "Charles Graham",
      "Chris Alexander",
      "Chris Clayton",
      "Chris Combs",
      "Chuck Rainey",
      "Clarence McDonald",
      "Cody Jasper",
      "Color Blind",
      "Cory Henry",
      "CW Ayon",
    ],
    D: [
      "Danny Flowers",
      "Dante & the Bird Dogs",
      "Darwin Jones",
      "Dave Wilkerson",
      "David Cleveland",
      "David Teegarden",
      "Debby Campbell",
      "Deborah Marinoni",
      "Demitrious Moore",
      "Dennie Beard",
      "Denny Cordell",
      "Disney Music Group",
      "D. J. Rogers",
      "Don Nix",
      "Don Preston",
      "Donald ‘Duck’ Dunn",
      "Doyle Tucker",
      "Dr. John",
      "Drake Macy",
      "Dwight Twilley",
    ],
    E: [
      "Ed Macy",
      "Eddie Everett",
      "Eddie Spear",
      "Eddy Kramer",
      "El Roacho",
      "Eli Mattson",
      "Elle King",
      "Elijah Jones",
      "Emily Shultz",
      "Eric Clapton",
      "Eric Michelson",
      "E. T. Gourmet",
      "Eureka",
    ],
    F: ["Flash Terry", "Followers of Christ", "Foreigner", "Frank Dremel"],
    G: [
      "G and The Jolly Cucumbers",
      "Gary Busey",
      "Gary Gilmore",
      "George Harrison",
      "George Highfil",
      "George Thorogood",
      "Georgie Fame",
      "Gerard Campbell",
      "Glynn Johns",
      "Grandson",
      "Grease Lizard Band",
      "Greater Mount Rose Baptist Church",
      "Gus Hardin",
    ],
    H: [
      "Hanson",
      "Head and the Heart",
      "Higher Dimensions Worship Band",
      "Hot Toast Music Company",
      "Hunter Plake",
      "Hua Pii",
    ],
    I: ["Insider"],
    J: [
      "Jake and the Idols",
      "James Proffitt",
      "Jamie Oldaker",
      "Jason Weinheimer",
      "JB Brakefield",
      "Jeff Cumpston",
      "Jerry Williams",
      "Jesse Aycock",
      "Jim Downing",
      "Jim Gilbert",
      "Jim Gordon",
      "Jim Horn",
      "Jim Keltner",
      "Jimmy Buffett",
      "Jimmy Day",
      "Jimmy Rogers",
      "Jimmy Webb",
      "J. J. Cale",
      "Joe Davis",
      "John Ford Coley",
      "John Fullbright",
      "John Salem",
      "Jordan Fisher",
      "Jose Hernandez",
      "Josh Feather",
    ],
    K: [
      "Karl Himmel",
      "Kansas",
      "Kathy Howard",
      "KK ATL TurnUp",
      "Kenny Loggins",
      "Kenny Ortega",
      "Kent Blazy",
      "Kevin Chamberlin",
      "Kevin Johnston",
      "Kevin Miller",
      "King Cabbage Brass Band",
      "Kirk Bressler",
      "Klymaxx",
      "Knee Capbobs",
      "Kristin Chenoweth",
    ],
    L: [
      "Larry Hosford",
      "Laura Ward",
      "Laurie Moore",
      "Lee Montgomery",
      "Leon Russell",
      "Life Church",
      "Lyons & Clark, Inc.",
    ],
    M: [
      "Madi McGuire",
      "Marc Benno",
      "Marc Cogman",
      "Marcella Levy",
      "Mary McCreary",
      "Marv Martin",
      "Master’s Touch",
      "Matt Maxwell",
      "Max Lee",
      "Maxine Sellers",
      "Michael Bluestein",
      "Michael Todd",
      "Mike Campbell",
      "Midnight Special",
      "Mike Gibson",
      "Mona Butts",
      "Mudcrutch",
      "Mutha Funck",
    ],
    N: ["New Grass Revival", "Nick Jordan", "Nicole Ordes", "Nitzinger"],
    O: [
      "Odell Stokes",
      "Okra and the Universe",
      "O’Neil Twins",
      "Oscar Boyd",
      "Outsiders Musical",
      "Ozark Mountain Bible College",
      "Ozark Mountain Folklore Association",
    ],
    P: [
      "Paige Su",
      "Paradox",
      "Patchwork",
      "Patrick Henderson",
      "Paul Benjaman",
      "Paul Humphrey",
      "Paul Ryan",
      "Peter Nicholls",
      "Phil Oliveira",
      "Phil Seymour",
      "Phillip Herder",
      "Phoebe Laube",
      "Phoebe Snow",
      "Presley River",
    ],
    Q: [],
    R: [
      "Randall Smith",
      "Raye D. Rowe",
      "Raymond Russell",
      "Rev. Patrick Henderson",
      "Richard Feldman",
      "Richard Torrance",
      "Rick Durbin",
      "Rick Reilly",
      "Ringo Starr",
      "Rita Coolidge",
      "Rob Ickes",
      "Roger Harris",
      "Ron Henry",
      "Ron Roper",
      "Ronnie Wilson",
      "Roscoe Smith",
      "Rusty Russell",
      "Rusty Weir",
    ],
    S: [
      "Sam Burchfield and the Scoundrels",
      "Sam Routh",
      "Sarah Popejoy",
      "Shades of Dead Radio",
      "She Hates Me Not",
      "ShelterVision",
      "Sherri Bergner",
      "Sixpence None the Richer",
      "Skilly Cole",
      "Southall",
      "Square Force",
      "Stephen Kellogg",
      "Stephen Schultz",
      "Steve Allen",
      "Steve Cropper",
      "Steve Durr",
      "Steve Fromholtz",
      "Steve Hickerson",
      "Steve Rice",
      "Steve Ripley",
      "Steven Effinger",
      "Stevie Wonder",
      "Suih Lun",
    ],
    T: [
      "Taj Mahal",
      "Teddy Jack Eddy",
      "Tedeschi Trucks Band",
      "The Dropkick Murphys",
      "The Gap Band",
      "The Giant Killers",
      "The Grease Band",
      "The Jimmy Markham Revue",
      "The National",
      "The Maytals",
      "The Mountain Goats",
      "The Sanders Band",
      "The Sceptics",
      "The Spirit Wind",
      "The So Watt Band",
      "The Switch",
      "The Tractors",
      "Thru It All",
      "Tokyo Souldout",
      "Tom Petty",
      "Tom Petty and The Heartbreakers",
      "Tom Russell",
      "Tommy Allsup",
      "Tommy Emmanuel",
      "Tommy Lokey",
      "Tommy Triplehorn",
      "Tony Secunda",
      "Travis Kidd",
      "Trey Hensley",
      "Trina Shoemaker",
      "Tulsa Praise Orchestra",
      "Turnpike Troubadours",
      "Twila Paris",
    ],
    U: ["Until Now", "Uriah Heep"],
    V: ["Van Schmoll", "Victory Church"],
    W: [
      "Wade Bowen",
      "Wailers",
      "Walter Earl",
      "Walt Richmond",
      "Warm",
      "Wayne Perkins",
      "Wes Reynolds",
      "Wes Studi",
      "Willie Lewis",
      "Willie Nelson",
      "William Sargent",
      "Willis Alan Ramsey",
      "Whiskey Throttle",
      "W.T. Cauley",
    ],
    X: ["Xavion", "Xebec"],
    Y: [],
    Z: ["Zac Wenzel"],
  };

  /* single-open like BackstagePass */
  const [openLetter, setOpenLetter] = useState(null);
  const toggleLetter = (k) => setOpenLetter((cur) => (cur === k ? null : k));

  return (
    <main className="page">
      <h1 className="page-title">Listen In</h1>

      {/* Mood Player (kept) */}
      <section className="section grid-card player">
        <div className="chip-row">
          {Object.entries(MOODS).map(([key, m]) => (
            <button
              key={key}
              className={`chip ${activeMood === key ? "" : "chip-ghost"}`}
              onClick={() => setActiveMood(key)}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div className="embed-wrap" style={{ marginTop: 12 }}>
          <iframe
            key={activeMood}
            title={`Listen – ${MOODS[activeMood]?.label}`}
            src={MOODS[activeMood]?.embed}
            height="352"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
          />
        </div>
      </section>

      {/* Clients (Backstage-style accordion) */}
      <section className="section">
        <div className="grid-card" style={{ padding: 16, marginBottom: 16 }}>
          <h2 style={{ marginTop: 0 }}>Clients</h2>
          <p className="muted" style={{ marginTop: 6 }}>
            Since 1972, we’ve enjoyed hosting outstanding sound engineers,
            entities, and artists. Thank you to all of the creatives for playing
            a part in the studio’s legacy.
          </p>
        </div>

        {Object.keys(CLIENTS).map((letter) => (
          <Accordion
            key={letter}
            id={`clients-${letter}`}
            title={letter}
            isOpen={openLetter === letter}
            onToggle={() => toggleLetter(letter)}
          >
            {CLIENTS[letter].length ? (
              <ul style={{ marginLeft: 18, marginTop: 6 }}>
                {CLIENTS[letter].map((name) => (
                  <li key={name} className="muted">
                    {name}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">No entries under {letter}.</p>
            )}
          </Accordion>
        ))}
      </section>
    </main>
  );
}

/* ---------- Backstage-style Accordion (same look/behavior) ---------- */
function Accordion({ id, title, children, isOpen = false, onToggle }) {
  const onSummary = (e) => {
    e.preventDefault();
    onToggle?.();
  };
  return (
    <details open={isOpen} className="grid-card" style={{ padding: 0 }}>
      <summary
        onClick={onSummary}
        style={{
          cursor: "pointer",
          padding: "14px 16px",
          fontWeight: 700,
          listStyle: "none",
          userSelect: "none",
        }}
        aria-controls={id}
        aria-expanded={isOpen}
      >
        {title}
      </summary>
      <motion.div
        id={id}
        style={{ padding: 16 }}
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.div>
    </details>
  );
}
