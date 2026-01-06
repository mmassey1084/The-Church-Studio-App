import React, { useState } from "react";
import { Browser } from "@capacitor/browser";
import Header from "../components/Header";

const TOUR_URL = "https://my.matterport.com/show/?m=zaLgt747Urk";

export default function MatterportTour() {
  const [iframeError, setIframeError] = useState(false);

  return (
    <div className="page page-tour">
      <Header />

      <h1 className="title">Explore The Church Studio</h1>  

      {/* Centered tour preview */}
      <div className="tour-stage">
        {!iframeError ? (
          <div className="tour-card">
            <iframe
              src={TOUR_URL}
              title="Matterport Tour"
              className="tour-iframe"
              allow="xr-spatial-tracking; fullscreen; autoplay"
              allowFullScreen
              onError={() => setIframeError(true)}
            />
          </div>
        ) : (
          <div className="tour-fallback">
            <p>The embedded tour didn’t load in-app on this device.</p>
            <button className="btn btn-ghost" onClick={openInBrowser}>
              Open Tour in Browser
            </button>
          </div>
        )}
      </div>
       <p>Explore The Church Studio like never before through an immersive 3D experience. 
        Walk through the historic space at your own pace and discover the rooms where 
        legendary recordings were made. This virtual tour brings the story, atmosphere, 
        and legacy of the studio to life from anywhere.
      </p>
    </div>
  );
}

