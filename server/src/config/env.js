// server/src/config/env.js
import dotenv from "dotenv";
dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT || 4000),
  HOST: process.env.API_HOST || "0.0.0.0",

  // Universe
  UNIVERSE_CLIENT_ID: process.env.UNIVERSE_CLIENT_ID || "",
  UNIVERSE_CLIENT_SECRET: process.env.UNIVERSE_CLIENT_SECRET || "",
  UNIVERSE_API_BASE: process.env.UNIVERSE_API_BASE || "https://www.universe.com",
  UNIVERSE_TOKEN_URL: process.env.UNIVERSE_TOKEN_URL || "",
  UNIVERSE_ACCESS_TOKEN: (process.env.UNIVERSE_ACCESS_TOKEN || "").trim(),
  UNIVERSE_GRAPHQL_PATH: (process.env.UNIVERSE_GRAPHQL_PATH || "/graphql").trim(),
  UNIVERSE_ORGANIZER_ID: (process.env.UNIVERSE_ORGANIZER_ID || "").trim(),
  UNIVERSE_ORGANIZER_SLUG: (process.env.UNIVERSE_ORGANIZER_SLUG || "the-church-studio").trim(),
  UNIVERSE_WEBHOOK_SECRET: (process.env.UNIVERSE_WEBHOOK_SECRET || "").trim(),

  // SubscriptionFlow
  SF_SITE: process.env.SF_SITE,
  SF_CLIENT_ID: process.env.SF_CLIENT_ID,
  SF_CLIENT_SECRET: process.env.SF_CLIENT_SECRET,

  // Firebase admin creds
  FIREBASE_SERVICE_ACCOUNT_FILE:
    process.env.FIREBASE_SERVICE_ACCOUNT_FILE || process.env.GOOGLE_APPLICATION_CREDENTIALS || "",
  FIREBASE_SERVICE_ACCOUNT_JSON: process.env.FIREBASE_SERVICE_ACCOUNT_JSON || "",
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
};

export const isProd = env.NODE_ENV === "production";

// Normalize derived env
env.UNIVERSE_TOKEN_URL =
  env.UNIVERSE_TOKEN_URL || `${env.UNIVERSE_API_BASE}/oauth/token`;
