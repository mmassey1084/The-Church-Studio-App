// src/App.jsx
import { useEffect } from "react";
import {BrowserRouter, Routes,  Route, useLocation,useNavigate} from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Capacitor } from "@capacitor/core";
import Header from "./components/Header.jsx";
import Home from "./pages/Home.jsx";
import VirtualTour from "./pages/VirtualTour.jsx";
import Archive from "./pages/Archive.jsx";
import ListenIn from "./pages/ListenIn.jsx";
import StudioGuide from "./pages/StudioGuide.jsx";
import BackstagePass from "./pages/Backstagepass.jsx";
import BottomNav from "./components/bottomNav.jsx";
import "./index.css";
import { initBeaconMonitoring } from "./beacons";
import EventsCalendar from "./pages/EventsCalendar.jsx";
import PreloadOnBoot from "./components/PreloadOnBoot";
import ScrollToTop from "./components/ScrollToTop";
import CheckoutCallback from "./pages/CheckoutCallback.jsx";

// NEW: register push helper
import { registerPush } from "./utils/registerPush";

function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

function AppRoutes() {
  const location = useLocation();
  const navigate = useNavigate();

  // Beacons (Capacitor deviceReady & fallback)
  useEffect(() => {
    const onReady = () => initBeaconMonitoring();
    document.addEventListener("deviceready", onReady, { once: true });
    const t = setTimeout(() => initBeaconMonitoring(), 800);
    return () => {
      document.removeEventListener("deviceready", onReady);
      clearTimeout(t);
    };
  }, []);

  // Register for push notifications on native (skip web/PWA)
  useEffect(() => {
    (async () => {
      const isNative = Capacitor?.isNativePlatform?.() ?? false;
      if (!isNative) {
        // ebug so we know why pushes won't register on web builds
        console.info("[push] Skipping registerPush on web/PWA");
        return;
      }

      try {
        const apiBase = import.meta.env.VITE_API_BASE;
        if (!apiBase) {
          console.warn(
            "[push] VITE_API_BASE is missing; cannot register token with server"
          );
          return;
        }

        await registerPush({
          apiBase,
          // topics: ["tunes-noon"], // optional; server already subscribes
          onDeepLink: (path) => {
            const to = String(path || "/listen-in");
            const next = to.startsWith("/") ? to : `/${to}`;
            console.log("[push] deep link ->", next);
            navigate(next);
          },
        });
      } catch (e) {
        console.warn("[push] registerPush failed:", e?.message || e);
      }
    })();
  }, [navigate]);

  return (
    <>
      <ScrollToTop />
      <div id="app-background" />
      <div id="app-overlay">
        <Header />
        <PreloadOnBoot />

        <AnimatePresence mode="wait" initial={false}>
          <Routes location={location} key={location.pathname + location.search}>
            <Route
              path="/checkout/callback"
              element={
                <PageTransition>
                  <CheckoutCallback />
                </PageTransition>
              }
            />
            <Route
              path="/"
              element={
                <PageTransition>
                  <Home />
                </PageTransition>
              }
            />
            <Route
              path="/virtual-tour"
              element={
                <PageTransition>
                  <VirtualTour />
                </PageTransition>
              }
            />
            <Route
              path="/archive"
              element={
                <PageTransition>
                  <Archive />
                </PageTransition>
              }
            />
            <Route
              path="/events"
              element={
                <PageTransition>
                  <EventsCalendar />
                </PageTransition>
              }
            />
            <Route
              path="/listen-in"
              element={
                <PageTransition>
                  <ListenIn />
                </PageTransition>
              }
            />
            <Route
              path="/studio-guide"
              element={
                <PageTransition>
                  <StudioGuide />
                </PageTransition>
              }
            />
            <Route
              path="/backstage-pass"
              element={
                <PageTransition>
                  <BackstagePass />
                </PageTransition>
              }
            />
          </Routes>
        </AnimatePresence>

        <BottomNav />
      </div>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
