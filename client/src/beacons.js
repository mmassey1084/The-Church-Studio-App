/* global cordova */
import { LocalNotifications } from "@capacitor/local-notifications";

// ---- Your beacon IDs
const UUID = "426C7565-4368-6172-6D42-6561636F6E73";
const MAJOR = 3838;
const MINOR = 4949;

// Small helpers
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log("[Beacon]", ...a);

export async function initBeaconMonitoring() {
  // Guard: Native only
  if (!window.cordova || !cordova.plugins?.locationManager) {
    log("Cordova/locationManager not ready yet — skipping init");
    return;
  }

  const { locationManager } = cordova.plugins;
  const diag = cordova.plugins.diagnostic;

  // ===== 1) Request runtime permissions (Android 12+) =====
  try {
    // Request Local Notifications permission
    const notif = await LocalNotifications.requestPermissions();
    log("Notification permission:", notif);

    // Request Bluetooth + Location runtime permissions together
    await new Promise((resolve) => {
      diag.requestRuntimePermissions(
        resolve,
        (err) => {
          log("requestRuntimePermissions error", err);
          resolve(null);
        },
        [
          diag.permission.BLUETOOTH_SCAN,
          diag.permission.BLUETOOTH_CONNECT,
          diag.permission.ACCESS_FINE_LOCATION,
          // Background location (Android 10+); safe to request, may be auto-denied on older
          diag.permission.ACCESS_BACKGROUND_LOCATION,
        ]
      );
    });
  } catch (e) {
    log("Runtime permission request threw", e);
  }

  // ===== 2) Ensure Bluetooth is enabled =====
  try {
    const btAvail = await new Promise((resolve) =>
      diag.isBluetoothEnabled(
        (on) => resolve(on),
        () => resolve(false)
      )
    );
    if (!btAvail) {
      log("Bluetooth is OFF -> opening Bluetooth settings");
      diag.switchToBluetoothSettings();
      // Give user a moment to flip the switch
      await sleep(1500);
    }
  } catch (e) {
    log("Bluetooth check error", e);
  }

  // ===== 3) Ensure Location Services are ON (required for BLE scans on Android) =====
  try {
    const locOn = await new Promise((resolve) =>
      diag.isLocationEnabled(
        (on) => resolve(on),
        () => resolve(false)
      )
    );
    if (!locOn) {
      log("Location Services are OFF -> opening Location settings");
      diag.switchToLocationSettings();
      await sleep(1500);
    }
  } catch (e) {
    log("Location services check error", e);
  }

  // ===== 4) Set up delegate & region =====
  const BeaconRegion = locationManager.BeaconRegion;
  const region = new BeaconRegion("churchStudioRegion", UUID, MAJOR, MINOR);

  const delegate = new locationManager.Delegate();

  delegate.didEnterRegion = async (event) => {
    log("🟢 didEnterRegion", event);
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: Date.now() % 2147483647,
            title: "Welcome to The Church Studio",
            body: "You’re nearby — tap for tours & exhibits.",
          },
        ],
      });
    } catch (e) {
      log("LocalNotifications ENTER error", e);
    }
  };

  delegate.didExitRegion = async (event) => {
    log("🔴 didExitRegion", event);
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: Date.now() % 2147483647,
            title: "See you next time!",
            body: "You’ve left The Church Studio beacon area.",
          },
        ],
      });
    } catch (e) {
      log("LocalNotifications EXIT error", e);
    }
  };

  // Foreground debug: see live beacons
  delegate.didRangeBeaconsInRegion = (event) => {
    const count = event?.beacons?.length || 0;
    if (count) {
      log(`📶 Ranged ${count} beacon(s):`, event.beacons);
    } else {
      // Comment out if too chatty:
      log("📶 Ranged 0 beacons in region");
    }
  };

  locationManager.setDelegate(delegate);

  // iOS will use this; Android will just no-op.
  try {
    await locationManager.requestAlwaysAuthorization();
  } catch (e) {
    log("requestAlwaysAuthorization error (likely harmless on Android):", e);
  }

  // ===== 5) Start monitoring & ranging =====
  try {
    await locationManager.startMonitoringForRegion(region);
    log("✅ startMonitoringForRegion OK");
  } catch (e) {
    log("❌ startMonitoringForRegion error", e);
  }

  try {
    await locationManager.startRangingBeaconsInRegion(region);
    log("✅ startRangingBeaconsInRegion OK");
  } catch (e) {
    log("❌ startRangingBeaconsInRegion error", e);
  }
}
