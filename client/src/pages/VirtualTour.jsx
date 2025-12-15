//VirtualTour.jsx
import React, { useMemo, useState } from "react";
import PanoViewer from "../components/PanoViewer";

export default function VirtualTour() {
  // define your scenes + hotspots
  const scenes = useMemo(() => ({
    lobby: {
      title: "Lobby & Exhibit",
      src: "/panos/lobby.png",
      // where the camera faces initially
      yaw: 0, pitch: 0,
      links: [
        { to: "live", yaw: 60, pitch: -2, label: "Go to Live Room" },
        { to: "control", yaw: -120, pitch: -2, label: "Go to Control Room" },
      ],
      info: [
        { yaw: -20, pitch: -5, label: "Artifact Case", body: "Historic memorabilia from the Church Studio archives." }
      ],
    },
    live: {
      title: "Studio A – Live Room",
      src: "/panos/live-room.png",
      yaw: 90, pitch: 0,
      links: [
        { to: "lobby", yaw: -120, pitch: -2, label: "Back to Lobby" },
        { to: "control", yaw: 15, pitch: -1, label: "View Control Room" },
      ],
      info: [
        { yaw: 30, pitch: -6, label: "Iso Booth", body: "Tight booth suitable for vocals and amps." },
        { yaw: 95, pitch: -8, label: "Chamber", body: "One of the live chambers used for natural reverb." },
      ],
    },
    control: {
      title: "Control Room",
      src: "/panos/live-room.png",
      yaw: 180, pitch: 0,
      links: [
        { to: "live", yaw: -60, pitch: -2, label: "To Live Room" },
        { to: "lobby", yaw: 160, pitch: -2, label: "To Lobby" },
      ],
      info: [
        { yaw: 170, pitch: -5, label: "Neve 8068", body: "Flagship console with Flying Faders II." },
        { yaw: -150, pitch: -4, label: "Studer A827", body: "2\" 24-track analog deck synced with Lynx-2." },
      ],
    },
  }), []);

  const [sceneId, setSceneId] = useState("lobby");
  const [infoCard, setInfoCard] = useState(null);

  return (
    <main className="page">
      <h1 className="page-title">Virtual Tour</h1>

      <div className="grid" style={{gridTemplateColumns:"1fr", gap:16}}>
        <PanoViewer
          sceneId={sceneId}
          scenes={scenes}
          onGotoScene={(id) => setSceneId(id)}
          onInfo={(info) => setInfoCard(info)}
        />

        {/* Quick Nav / Highlights */}
        <section className="grid-card" aria-label="Highlights">
          <h2 style={{marginTop:0}}>Highlights</h2>
          <ul>
            <li>Studio A – live room walkthrough</li>
            <li>Control room – gear hotspots</li>
            <li>Lobby & exhibit – artifacts callouts</li>
          </ul>

          <div style={{display:"flex", gap:8, flexWrap:"wrap", marginTop:8}}>
            <button className="btn" onClick={()=>setSceneId("lobby")}>Lobby</button>
            <button className="btn" onClick={()=>setSceneId("live")}>Live Room</button>
            <button className="btn" onClick={()=>setSceneId("control")}>Control Room</button>
          </div>
        </section>
      </div>

      {/* Info card when clicking info hotspots */}
      {infoCard && (
        <div
          role="dialog"
          aria-modal="true"
          className="grid-card"
          style={{position:"fixed", left:16, right:16, bottom:100, zIndex:3000, maxWidth:640, margin:"0 auto"}}
        >
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", gap:8}}>
            <h3 style={{margin:0}}>{infoCard.label}</h3>
            <button className="btn-ghost" onClick={()=>setInfoCard(null)} aria-label="Close">Close</button>
          </div>
          <p style={{marginTop:8, opacity:.9}}>{infoCard.body}</p>
        </div>
      )}
    </main>
  );
}

