// src/components/PreloadOnBoot.jsx
import { useEffect } from "react";
import { fetchPlans } from "../lib/api";

const PLANS_CACHE_KEY = "BSP_PLANS_CACHE_V1";
const PLANS_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

function setPlansCache(plans) {
  try {
    const byId = Object.fromEntries(
      plans.map((p) => [p?.id || p?.plan_id || p?.uuid, p]).filter(([k]) => !!k)
    );
    localStorage.setItem(
      PLANS_CACHE_KEY,
      JSON.stringify({ ts: Date.now(), list: plans, byId })
    );
  } catch {}
}

function hasFreshPlans() {
  try {
    const raw = localStorage.getItem(PLANS_CACHE_KEY);
    if (!raw) return false;
    const { ts } = JSON.parse(raw);
    return ts && Date.now() - ts < PLANS_TTL_MS;
  } catch {
    return false;
  }
}

export default function PreloadOnBoot() {
  useEffect(() => {
    // don’t refetch if cache is fresh
    if (hasFreshPlans()) return;

    const run = async () => {
      try {
        const raw = await fetchPlans();
        const arr = Array.isArray(raw) ? raw : [];
        setPlansCache(arr);
      } catch {

      }
    };

    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(run, { timeout: 1500 });
      return () => window.cancelIdleCallback?.(id);
    } else {
      const t = setTimeout(run, 400);
      return () => clearTimeout(t);
    }
  }, []);

  return null; 
}
