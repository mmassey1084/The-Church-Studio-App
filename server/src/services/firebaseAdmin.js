// server/src/services/firebaseAdmin.js
import fs from "fs";
import admin from "firebase-admin";
import { env } from "../config/env.js";

function loadFirebaseCreds() {
  const filePath = env.FIREBASE_SERVICE_ACCOUNT_FILE;
  if (filePath) {
    try {
      const text = fs.readFileSync(filePath, "utf8");
      return JSON.parse(text);
    } catch (e) {
      console.warn("⚠️ Could not read service account file:", filePath, e.message);
    }
  }

  const raw = env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (raw) {
    try {
      const looksB64 =
        /^[A-Za-z0-9+/=]+$/.test(raw.trim()) && !raw.trim().startsWith("{");
      const text = looksB64 ? Buffer.from(raw, "base64").toString("utf8") : raw;
      return JSON.parse(text);
    } catch (e) {
      console.warn("⚠️ FIREBASE_SERVICE_ACCOUNT_JSON failed to parse:", e.message);
    }
  }

  const projectId = env.FIREBASE_PROJECT_ID;
  const clientEmail = env.FIREBASE_CLIENT_EMAIL;
  let privateKey = env.FIREBASE_PRIVATE_KEY;
  if (privateKey) privateKey = privateKey.replace(/\\n/g, "\n");

  if (projectId && clientEmail && privateKey) {
    return {
      type: "service_account",
      project_id: projectId,
      client_email: clientEmail,
      private_key: privateKey,
    };
  }

  return null;
}

export function initFirebaseAdmin() {
  try {
    if (admin.apps?.length) return { admin, adminInitialized: true };

    const cred = loadFirebaseCreds();
    if (!cred) {
      console.warn(
        "⚠️ Firebase Admin NOT initialized (no credentials found). Set FIREBASE_SERVICE_ACCOUNT_FILE=./serviceAccount.json in server/.env"
      );
      return { admin, adminInitialized: false };
    }

    admin.initializeApp({ credential: admin.credential.cert(cred) });
    console.log("✅ Firebase Admin initialized for push");
    return { admin, adminInitialized: true };
  } catch (e) {
    console.error("❌ Firebase Admin init failed:", e?.message || e);
    return { admin, adminInitialized: false };
  }
}
