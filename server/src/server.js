// server/src/server.js
import { env } from "./config/env.js";
import { initFirebaseAdmin } from "./services/firebaseAdmin.js";
import { createApp } from "./app.js";
import { scheduleTunesNoon } from "./schedulers/tunesNoon.scheduler.js";

const { admin, adminInitialized } = initFirebaseAdmin();
const app = createApp({ admin, adminInitialized });

// Start schedulers
scheduleTunesNoon({ admin, adminInitialized });

app.listen(env.PORT, env.HOST, () => {
  const hostShown = env.HOST === "0.0.0.0" ? "localhost" : env.HOST;
  console.log(`\n🚀 Server running on http://${hostShown}:${env.PORT}`);
  console.log(`   [READY] Using ORGANIZER_ID = ${env.UNIVERSE_ORGANIZER_ID || "<undefined>"}`);
});
