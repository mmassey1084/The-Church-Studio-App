// server/src/routes/plans.routes.js
import { Router } from "express";
import { getAuthToken } from "../services/subscriptionflow/tokenService.js";
import { fetchPlans } from "../services/subscriptionflow/plansService.js";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const token = await getAuthToken();
    const plans = await fetchPlans(token);
    return res.json(plans);
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({
      error: err.message || "Server Error",
      details: err.body ? { body: err.body } : undefined,
    });
  }
});

export default router;
