// src/utils/registerPush.js
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";

/**
 * Register the device for push notifications and subscribe to the "tunes-noon" topic.
 *
 * @param {Object} options
 * @param {string} options.apiBase - Base URL of your API server (e.g., import.meta.env.VITE_API_BASE)
 * @param {(path: string) => void} [options.onDeepLink] - Callback for navigation when a notification is tapped
 */
export async function registerPush(options = {}) {
  const { apiBase, onDeepLink = () => {} } = options;

  if (!Capacitor.isNativePlatform()) {
    console.log("[push] Skipping registration (not a native platform)");
    return;
  }

  if (!apiBase) {
    console.warn("[push] Missing apiBase, cannot register device.");
    return;
  }

  try {
    // 1️⃣ Check notification permissions
    const permStatus = await PushNotifications.checkPermissions();
    if (permStatus.receive !== "granted") {
      const reqStatus = await PushNotifications.requestPermissions();
      if (reqStatus.receive !== "granted") {
        console.warn("[push] Permission denied by user");
        return;
      }
    }

    // 2️⃣ Register with FCM/APNs
    await PushNotifications.register();

    // 3️⃣ On registration success — send token to your server
    PushNotifications.addListener("registration", async (token) => {
      try {
        console.log("[push] Device token:", token.value?.slice(0, 18) + "…");
        console.log("[push] FULL Device token:", token.value);

        const res = await fetch(`${apiBase}/api/push/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: token.value,
            platform: Capacitor.getPlatform(),
          }),
        });

        const json = await res.json();
        if (!res.ok) throw new Error(JSON.stringify(json));
        console.log("[push] Registered successfully:", json);
      } catch (err) {
        console.error("[push] Error registering device:", err);
      }
    });

    // 4️⃣ Foreground notification handler
    PushNotifications.addListener(
      "pushNotificationReceived",
      (notification) => {
        console.log("[push] Notification received (foreground):", notification);
      }
    );

    // 5️⃣ Notification tap handler (deep links or external URLs)
    PushNotifications.addListener(
      "pushNotificationActionPerformed",
      (action) => {
        const data = action?.notification?.data || {};
        console.log("[push] Notification tapped:", data);

        if (data.url) {
          // Open external site (like your "Tunes @ Noon" webpage)
          if (String(data.url).startsWith("http")) {
            window.open(data.url, "_system");
          } else {
            onDeepLink(`${data.url}`);
          }
        } else if (data.route) {
          onDeepLink(`${data.route}`);
        } else {
          console.log("[push] No route or URL found in notification data");
        }
      }
    );
  } catch (error) {
    console.error("[push] Registration error:", error);
  }
}
