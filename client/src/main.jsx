// src/main.jsx
// --- Kill SW & caches whenever the API base is ngrok (dev/prod) ---
const API_BASE = import.meta.env.VITE_API_BASE || "";
if (API_BASE.includes("ngrok")) {
  // Unregister any active service workers
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .getRegistrations()
      .then((regs) => Promise.all(regs.map((r) => r.unregister())))
      .catch(() => {});
  }
  // Clear all runtime caches
  if (window.caches?.keys) {
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .catch(() => {});
  }
}

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

// 🆕 Native-only bits (no effect on web)
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
// 👉 NEW: control Android system navigation bar (back/home area)
import { NavigationBar } from "@capgo/capacitor-navigation-bar";

/**
 * Request runtime permissions required for beacon ranging on Android 12+.
 * - Runs only on native builds (Capacitor)
 * - Uses cordova.plugins.diagnostic if available (no-op otherwise)
 * - Requests Local Notifications permission as well (for proximity alerts)
 */
(async function bootstrapNativePermissions() {
  try {
    if (!Capacitor.isNativePlatform()) return;

    // Ask for notification permission (iOS/Android 13+)
    try {
      const notif = await LocalNotifications.requestPermissions();
      console.log("[Notifications] permission:", notif);
    } catch (e) {
      console.log("[Notifications] request failed (ignored):", e);
    }

    // Android runtime permissions via diagnostic plugin (if present)
    if (
      Capacitor.getPlatform() === "android" &&
      window.cordova?.plugins?.diagnostic
    ) {
      const d = window.cordova.plugins.diagnostic;

      const ensure = (perm) =>
        new Promise((resolve) => {
          d.getPermissionAuthorizationStatus(
            (status) => {
              if (status !== d.permissionStatus.GRANTED) {
                d.requestRuntimePermission(
                  () => resolve(true),
                  () => resolve(false),
                  perm
                );
              } else {
                resolve(true);
              }
            },
            () => resolve(false),
            perm
          );
        });

      await ensure(d.permission.ACCESS_FINE_LOCATION);
      await ensure(d.permission.ACCESS_COARSE_LOCATION);
      await ensure(d.permission.BLUETOOTH_SCAN);
      await ensure(d.permission.BLUETOOTH_CONNECT);
      await ensure(d.permission.POST_NOTIFICATIONS);
      console.log(
        "[Permissions] Android BLE/location/notifications requested."
      );
    } else {
      console.log(
        "[Permissions] Diagnostic plugin not available; skipping Android runtime requests."
      );
    }
  } catch (err) {
    console.log("[Permissions] bootstrap error:", err);
  }
})();

/**
 * 🟫 Style Android system navigation bar (back/home/recents) to light grey with dark icons.
 * No-ops on web and iOS.
 */
(async function styleAndroidSystemNavBar() {
  try {
    if (!Capacitor.isNativePlatform()) return;
    if (Capacitor.getPlatform() !== "android") return;

    const lightGrey = "#E0E0E0";

    // Primary API for @capgo/capacitor-navigation-bar
    try {
      await NavigationBar.setNavigationBarColor({
        color: lightGrey,
        darkButtons: true, // dark icons on a light bar
      });
      console.log("[NavigationBar] set via setNavigationBarColor");
    } catch {
      // Fallback older API names if the plugin version differs
      try {
        await NavigationBar.setColor?.({ color: lightGrey });
        await NavigationBar.setStyle?.({ style: "DARK" });
        console.log("[NavigationBar] set via fallback API");
      } catch (e2) {
        console.log("[NavigationBar] unable to set color:", e2?.message || e2);
      }
    }
  } catch (e) {
    console.log("[NavigationBar] error:", e);
  }
})();

// ✅ Only register the SW in production AND when API base is NOT ngrok
if (import.meta.env.PROD && !API_BASE.includes("ngrok")) {
  (async () => {
    const { registerSW } = await import("virtual:pwa-register");
    registerSW({
      onRegisteredSW(swUrl, r) {
        console.log("SW registered (production):", swUrl, r);
      },
      onRegisterError(e) {
        console.log("SW registration failed:", e);
      },
    });
  })();
} else {
  console.log("Skipping SW registration (dev or ngrok API).");
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
