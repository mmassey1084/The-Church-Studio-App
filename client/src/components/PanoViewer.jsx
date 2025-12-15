// src/components/PanoViewer.jsx
import { useEffect, useRef } from "react";
import "pannellum/build/pannellum.css";
import pannellum from "../lib/pannellum-shim";

export default function PanoViewer({ sceneId, scenes, onGotoScene, onInfo }) {
  const elRef = useRef(null);
  useEffect(() => {
    if (!elRef.current || !pannellum) return;

    const scene = scenes[sceneId];
    const viewer = pannellum.viewer(elRef.current, {
      type: "equirectangular",
      panorama: scene.src,
      autoLoad: true,
      pitch: 0,
      yaw: 0,
      hfov: 100,
      hotSpots: (scene.hotspots || []).map((h) => ({
        pitch: h.pitch,
        yaw: h.yaw,
        text: h.text,
        clickHandlerFunc:
          h.type === "link" ? () => onGotoScene?.(h.to) : () => onInfo?.(h.id),
      })),
    });

    return () => viewer && viewer.destroy && viewer.destroy();
  }, [sceneId, scenes, onGotoScene, onInfo]);

  return (
    <div
      ref={elRef}
      style={{
        width: "100%",
        height: 420,
        borderRadius: 12,
        overflow: "hidden",
      }}
    />
  );
}
