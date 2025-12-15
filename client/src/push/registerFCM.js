// src/push/registerFCM.js
import { FirebaseMessaging } from "@capacitor-firebase/messaging";

export async function registerForPush() {
  try {
    // 1) Ask Android 13+ for POST_NOTIFICATIONS permission
    const perm = await FirebaseMessaging.requestPermissions();
    if (perm.receive !== "granted") {
      console.warn("[push] notifications permission NOT granted");
      return null;
    }

    // 2) Ensure a notification channel named "default" exists (Android)
    await FirebaseMessaging.createChannel({
      id: "default",
      name: "Default",
      importance: 4, // HIGH
    });

    // 3) Get the FCM token
    const { token } = await FirebaseMessaging.getToken();
    console.log("[push] FCM token:", token);
    return token || null;
  } catch (e) {
    console.warn("[push] register error:", e);
    return null;
  }
}
