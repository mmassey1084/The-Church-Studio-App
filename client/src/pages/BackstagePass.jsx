// BackstagePass.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchPlans } from "../lib/api";
import { readCache, writeCache, swrLoad } from "../lib/planCache";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { InAppBrowser } from "@awesome-cordova-plugins/in-app-browser";

/* ------------------------------------------------------------------ */
/* Canonical tier lists + price labels*/
/* ------------------------------------------------------------------ */
const ALLOWED_ANNUAL = ["entry", "standard", "premium", "family"];
const ALLOWED_MONTHLY = ["entry", "standard", "premium", "family"];

const PRICE_LABEL = {
  // Annual
  "annual.entry": "$69 / year",
  "annual.standard": "$169 / year",
  "annual.premium": "$269 / year",
  "annual.family": "$499 / year",
  // Monthly
  "monthly.entry": "$6.99 / month",
  "monthly.standard": "$15.99 / month",
  "monthly.premium": "$24.99 / month",
  "monthly.family": "$45.99 / month",
  // Corporate
  "corporate.silver.annual": "$1,000 / year",
  "corporate.silver.monthly": "$99 / month",
  "corporate.gold.annual": "$5,000 / year",
  "corporate.gold.monthly": "$499 / month",
  "corporate.platinum.annual": "$10,000 / year",
  "corporate.platinum.monthly": "$899 / month",
  // Lifetime
  lifetime: "$10,000 LIFETIME",
};

/* -------------------- Perks / copy blocks -------------------- */
const PERKS = {
  entry: [
    "Free admission for one year to the gallery +1.",
    "Free admission to Tunes @ Noon.",
    "Priority invitation to “The Lounge,” exclusive events, exhibit openings, and members-only events.",
    "Membership card valid for 12 months.",
    "Free private tour +1.",
    "10% off Church event tickets, merchandise, instore and online.",
    "10% off booking of suites at Duets Bed & Breakfast.",
    "Exclusive Harwelden Mansion access to Freedom Fest.",
    "Supporting the studio’s mission, artist grants and programming.",
  ],
  standard: [
    "All benefits of Entry Membership.",
    "Classic Logo T-Shirt.",
    "Harwelden Mansion tour +1.",
    "2 Adult Beverages at The Lounge.",
    "10% off suite rental and merchandise at Harwelden Mansion.",
  ],
  premium: [
    "All benefits of Standard Membership.",
    "2 Classic Logo T-Shirts.",
    "2 Membership cards valid for 12 months.",
    "Free private tour +2.",
    "Harwelden Mansion tour +2.",
    "Exclusive Freedom Fest access for 2.",
  ],
  family: [
    "All benefits of Standard Membership.",
    "4 Classic Logo T-Shirts.",
    "4 Membership cards valid for 12 months.",
    "Free private tour +3.",
    "Harwelden Mansion tour +3.",
    "Exclusive Freedom Fest access for 3.",
  ],
  corporate: [
    "All Perks of Standard Membership",
    "Corporate Memberships are Tax Deductible",
    "A signed copy of the beautiful coffee table book, Sanctuary of Sound for your lobby or conference room.",
    "Free employee passes for guided tours of The Church Studio museum.",
    "Discounts on venue rentals for client receptions and team gatherings.",
    "Discounts on merchandise in our online or brick and mortar store.",
    "Invitations to exclusive members-only VIP events.",
    "Recognition on our website and in our annual report.",
    "The opportunity to sponsor recording grants for local musicians through our Artist Grant program.",
    "Membership certificate for your office and website.",
    "Together, we can preserve Tulsa’s music heritage while giving today’s artists the tools to create tomorrow’s sound.",
  ],
  lifetime: [
    "All benefits of the Standard Membership.",
    "20% off Church event tickets, merchandise, instore and online.",
    "Original wood plank memento.",
    "Classic Logo T-Shirt.",
    "Private archive tour for up to 10.",
    "Private historic tour for up to 10.",
    "10 Free guest passes per year for historic tours.",
    "Priority invitation to exclusive events.",
    "Founding member recognition on the official website and building.",
    "Supporting the studio’s mission, artist grants and programming.",
  ],
};

/* ------------------------- Utilities ------------------------- */
function idOf(obj) {
  return (
    obj?.id ??
    obj?.plan_id ??
    obj?.uuid ??
    obj?.PlanId ??
    obj?.plan?.id ??
    undefined
  );
}
function norm(s = "") {
  return s.toLowerCase();
}
function isCorporate(name = "") {
  return /corporate|silver|gold|platinum/.test(norm(name));
}
function corpTier(name = "") {
  if (/platinum/.test(norm(name))) return "platinum";
  if (/gold/.test(norm(name))) return "gold";
  return "silver";
}
function intervalOf(plan) {
  const n = norm(plan?.name || "");
  const i = norm(
    plan?.interval || plan?.billing_interval || plan?.pricing?.interval || ""
  );
  if (/month|monthly/.test(n) || /month/.test(i)) return "monthly";
  if (/year|annual|yr/.test(n) || /year/.test(i)) return "annual";
  return "annual";
}
function tierOf(name = "") {
  const n = norm(name);
  if (/family/.test(n)) return "family";
  if (/premium/.test(n)) return "premium";
  if (/standard/.test(n)) return "standard";
  if (/entry|basic/.test(n)) return "entry";
  return "";
}
function priceLabel(plan) {
  if (!plan) return "";
  if (isCorporate(plan.name)) {
    const t = corpTier(plan.name);
    const iv = intervalOf(plan);
    return PRICE_LABEL[`corporate.${t}.${iv}`] || "";
  }
  if (/lifetime|founding/.test(norm(plan.name))) return PRICE_LABEL.lifetime;
  const t = tierOf(plan.name);
  const iv = intervalOf(plan);
  return PRICE_LABEL[`${iv}.${t}`] || "";
}

/* Robust JSON fetch */
async function fetchJsonSafe(url, opts = {}) {
  const resp = await fetch(url, opts);
  const text = await resp.text();
  const ct = resp.headers.get("content-type") || "";
  if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${text.slice(0, 140)}`);
  if (!/application\/json/i.test(ct) || text.startsWith("<!DOCTYPE")) {
    throw new Error("Server returned non-JSON (tunnel/cache)");
  }
  return JSON.parse(text);
}
function filterDedupe(raw = []) {
  const seen = new Set();
  const out = [];
  for (const p of raw) {
    const name = (p?.name || "").trim();
    if (!name) continue;
    const n = norm(name);
    const t = tierOf(n);
    const iv = intervalOf(p);
    const consumerAllowed =
      (iv === "annual" &&
        ["entry", "standard", "premium", "family"].includes(t)) ||
      (iv === "monthly" &&
        ["entry", "standard", "premium", "family"].includes(t));
    const include =
      consumerAllowed || isCorporate(n) || /lifetime|founding/.test(n);
    if (!include) continue;
    const key = `${n}:${iv}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
  }
  return out;
}

/* -------------------------- Page -------------------------- */
export default function BackstagePass() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoad] = useState(true);
  const [error, setError] = useState("");
  const [confirmPlan, setConfirmPlan] = useState(null);
  const [openAcc, setOpenAcc] = useState(null);
  const [freshState, setFreshState] = useState("fresh"); // 'cached' | 'fresh'

  // Overlay state for checkout
  const [checkoutPending, setCheckoutPending] = useState(false);
  const [checkoutMessage, setCheckoutMessage] = useState(
    "Preparing secure checkout…"
  );

  const API = (import.meta.env.VITE_API_BASE || "").trim();
  const locale = (import.meta.env.VITE_SF_LOCALE || "en").trim();

  const APP_BASE = (
    import.meta.env.VITE_APP_BASE_URL || window.location.origin
  ).replace(/\/+$/, "");
  const successUrl = `${APP_BASE}/checkout/callback?status=success`;
  const cancelUrl = `${APP_BASE}/checkout/callback?status=cancel`;

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  // lock scroll if modal OR overlay is up
  useEffect(() => {
    if (confirmPlan || checkoutPending) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev || "";
      };
    }
  }, [confirmPlan, checkoutPending]);

  useEffect(() => {
    let mounted = true;
    const { plans: cached, fresh } = readCache();
    if (Array.isArray(cached) && cached.length) {
      setPlans(cached);
      setLoad(false);
      setFreshState(fresh ? "fresh" : "cached");
    }
    (async () => {
      try {
        await swrLoad({
          loader: async () => {
            const raw = await fetchPlans();
            return filterDedupe(Array.isArray(raw) ? raw : []);
          },
          onUpdate: (freshPlans) => {
            if (!mounted) return;
            setPlans(freshPlans);
            setLoad(false);
            setFreshState("fresh");
          },
        });
        if (!cached) setLoad(false);
      } catch (e) {
        if (!cached) setError(e.message || "Failed to load plans");
        setLoad(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (plans && plans.length) writeCache(plans);
  }, [plans]);

  // JUST opens the checkout – does not touch state
  const goCheckout = useCallback(
    async (plan) => {
      const planId = idOf(plan);
      if (!planId) {
        alert("Missing plan id.");
        return;
      }

      console.log("[BackstagePass] goCheckout for plan", plan?.name, planId);

      const u = new URL(
        `${API}/api/plans/${encodeURIComponent(planId)}/checkout-url`
      );
      u.searchParams.set("locale", locale);
      u.searchParams.set("successUrl", successUrl);
      u.searchParams.set("cancelUrl", cancelUrl);
      u.searchParams.set("_", Date.now().toString());

      try {
        const data = await fetchJsonSafe(u.toString(), {
          method: "GET",
          mode: "cors",
          cache: "no-store",
          headers: {
            Accept: "application/json",
            "ngrok-skip-browser-warning": "1",
          },
        });
        if (!data?.url) throw new Error("Missing checkout URL from server");

        const url = data.url;
        const isNative = Capacitor.isNativePlatform();

        console.log("[BackstagePass] checkout URL:", url);
        console.log("[BackstagePass] isNative:", isNative);

        if (
          isNative &&
          typeof window !== "undefined" &&
          window.cordova?.InAppBrowser
        ) {
          const features = [
            "location=no",
            "toolbar=yes",
            "hideurlbar=yes",
            "hardwareback=yes",
            "zoom=no",
          ].join(",");

          const ref = window.cordova.InAppBrowser.open(url, "_blank", features);

          const onLoadStop = (e) => {
            const current = e.url || "";
            if (
              current.startsWith(successUrl) ||
              current.startsWith(cancelUrl)
            ) {
              try {
                ref.close();
              } catch {}
              try {
                localStorage.setItem(
                  "checkout:lastStatus",
                  current.includes("status=success") ? "success" : "cancel"
                );
              } catch {}
            }
          };

          const onExit = () => {
            try {
              ref.removeEventListener("loadstop", onLoadStop);
            } catch {}
          };

          ref.addEventListener("loadstop", onLoadStop);
          ref.addEventListener("exit", onExit);
          return;
        }

        if (isNative) {
          await Browser.open({
            url,
            presentationStyle: "fullscreen",
            windowName: "_blank",
          });
          return;
        }

        const w = window.open(url, "_blank", "noopener,noreferrer");
        if (!w) window.location.href = url;
      } catch (err) {
        console.warn("Checkout open failed:", err);
        alert(err.message || "Could not create checkout link");
      }
    },
    [API, locale, successUrl, cancelUrl]
  );

  // This is what the JoinModal calls
  const handlePlanCheckout = useCallback(
    (plan) => {
      if (!plan) return;
      console.log("[BackstagePass] handlePlanCheckout clicked", plan?.name);

      setConfirmPlan(null);
      setCheckoutMessage("Preparing secure checkout…");
      setCheckoutPending(true);
      console.log("[BackstagePass] checkoutPending = true");

      // Give React a tick to paint the overlay, then hit the server
      setTimeout(() => {
        (async () => {
          try {
            await goCheckout(plan);
          } finally {
            // When the user comes back (web) or if something fails, clear the overlay
            setCheckoutPending(false);
            console.log("[BackstagePass] checkoutPending = false");
          }
        })();
      }, 150);
    },
    [goCheckout]
  );

  /* ------------ derived lists ------------ */
  const annualPlans = useMemo(
    () =>
      plans
        .filter(
          (p) =>
            !isCorporate(p.name) &&
            /annual|year/i.test(p.name + " " + (p.interval || ""))
        )
        .map((p) => ({ ...p, _tier: tierOf(p.name) }))
        .filter((p) => ALLOWED_ANNUAL.includes(p._tier))
        .sort(sortByTier),
    [plans]
  );

  const monthlyPlans = useMemo(
    () =>
      plans
        .filter(
          (p) =>
            !isCorporate(p.name) &&
            /month/i.test(p.name + " " + (p.interval || ""))
        )
        .map((p) => ({ ...p, _tier: tierOf(p.name) }))
        .filter((p) => ALLOWED_MONTHLY.includes(p._tier))
        .sort(sortByTier),
    [plans]
  );

  const corporatePlans = useMemo(
    () =>
      plans
        .filter((p) => isCorporate(p.name))
        .map((p) => ({
          ...p,
          _corpTier: corpTier(p.name),
          _interval: intervalOf(p),
        }))
        .sort((a, b) => corpRank(a) - corpRank(b)),
    [plans]
  );

  const lifetimePlan = useMemo(
    () => plans.find((p) => /lifetime|founding/i.test(p?.name || "")) || null,
    [plans]
  );

  return (
    <motion.main
      className="page"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.24, ease: "easeOut" }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <h1 className="page-title">Backstage Pass</h1>
        <span
          role="status"
          aria-live="polite"
          className={`badge ${
            freshState === "fresh" ? "badge-ok" : "badge-warn"
          }`}
          title={
            freshState === "fresh"
              ? "Plans updated."
              : "Showing cached plans while refreshing."
          }
        >
          {freshState === "fresh" ? "updated just now" : "cached data"}
        </span>
      </div>

      <section className="section" style={{ marginTop: 0 }}>
        {/* Annual */}
        <Accordion
          id="annual"
          title="Annual Memberships"
          isOpen={openAcc === "annual"}
          onToggle={() => setOpenAcc(openAcc === "annual" ? null : "annual")}
        >
          {error ? (
            <p style={{ color: "red" }}>{error}</p>
          ) : loading && annualPlans.length === 0 ? (
            <SkeletonPlanGrid />
          ) : (
            <div className="grid">
              <AnimatePresence>
                {annualPlans.map((plan) => (
                  <motion.div
                    key={idOf(plan)}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <PlanCard
                      title={`${titleFor(plan)} — ${priceLabel(plan)}`}
                      perks={PERKS[plan._tier] || []}
                      onJoin={() => setConfirmPlan(plan)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
              {!annualPlans.length && <p>No annual plans available.</p>}
            </div>
          )}
        </Accordion>

        {/* Monthly */}
        <Accordion
          id="monthly"
          title="Monthly Memberships"
          isOpen={openAcc === "monthly"}
          onToggle={() => setOpenAcc(openAcc === "monthly" ? null : "monthly")}
        >
          {error ? (
            <p style={{ color: "red" }}>{error}</p>
          ) : loading && monthlyPlans.length === 0 ? (
            <SkeletonPlanGrid />
          ) : (
            <div className="grid">
              <AnimatePresence>
                {monthlyPlans.map((plan) => (
                  <motion.div
                    key={idOf(plan)}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <PlanCard
                      title={`${titleFor(plan)} — ${priceLabel(plan)}`}
                      perks={PERKS[plan._tier] || []}
                      onJoin={() => setConfirmPlan(plan)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
              {!monthlyPlans.length && <p>No monthly plans available.</p>}
            </div>
          )}
        </Accordion>

        {/* Corporate */}
        <Accordion
          id="corporate"
          title="Corporate Membership"
          isOpen={openAcc === "corporate"}
          onToggle={() =>
            setOpenAcc(openAcc === "corporate" ? null : "corporate")
          }
        >
          {error ? (
            <p style={{ color: "red" }}>{error}</p>
          ) : loading && corporatePlans.length === 0 ? (
            <SkeletonPlanGrid />
          ) : (
            <div className="grid">
              <AnimatePresence>
                {groupCorporate(corporatePlans).map((p) => (
                  <motion.div
                    key={idOf(p) + ":" + p._interval}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <PlanCard
                      title={`${corpTitle(p)} — ${priceLabel(p)}`}
                      perks={PERKS.corporate}
                      highlight
                      onJoin={() => setConfirmPlan(p)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
              {!corporatePlans.length && <p>No corporate plans available.</p>}
            </div>
          )}
        </Accordion>

        {/* Lifetime */}
        {lifetimePlan && (
          <Accordion
            id="lifetime"
            title="Founding Lifetime Membership"
            isOpen={openAcc === "lifetime"}
            onToggle={() =>
              setOpenAcc(openAcc === "lifetime" ? null : "lifetime")
            }
          >
            {error ? (
              <p style={{ color: "red" }}>{error}</p>
            ) : loading && !lifetimePlan ? (
              <SkeletonPlanGrid />
            ) : (
              <div className="grid">
                <PlanCard
                  key={idOf(lifetimePlan)}
                  title={`Founding Lifetime — ${PRICE_LABEL.lifetime}`}
                  perks={PERKS.lifetime}
                  highlight
                  onJoin={() => setConfirmPlan(lifetimePlan)}
                />
              </div>
            )}
          </Accordion>
        )}
      </section>

      <MemberPerks />

      <section className="section grid">
        <ImpactCard
          title="Where Your Support Goes"
          bullets={[
            "Preserving Tulsa’s music heritage through our museum & archive.",
            "Youth education and outreach programs.",
            "Artist grants and recording support.",
            "Community concerts and workshops.",
          ]}
        />
        <ImpactCard
          title="Questions?"
          bullets={[
            "Need help choosing a membership?",
            "Want to discuss Corporate or Lifetime tiers?",
          ]}
          cta={{ href: "mailto:info@thechurchstudio.com", label: "Email Us" }}
        />
      </section>

      {confirmPlan && (
        <JoinModal
          plan={confirmPlan}
          titleText={modalTitle(confirmPlan)}
          perks={modalPerks(confirmPlan)}
          onCancel={() => setConfirmPlan(null)}
          onConfirm={() => handlePlanCheckout(confirmPlan)}
        />
      )}

      {checkoutPending && (
        <LoadingOverlay message={checkoutMessage || "Preparing checkout…"} />
      )}
    </motion.main>
  );
}

/* -------------------- Derived helpers -------------------- */
function titleFor(plan) {
  const t = tierOf(plan?.name || "");
  return t ? capitalize(t) : plan?.name || "Membership";
}
function corpTitle(p) {
  const t = p?._corpTier || corpTier(p?.name || "");
  return `${capitalize(t)} Corporate (${capitalize(
    p?._interval || intervalOf(p)
  )})`;
}
function modalTitle(plan) {
  if (isCorporate(plan?.name)) return corpTitle(plan);
  if (/lifetime|founding/i.test(plan?.name || ""))
    return "Founding Lifetime Membership";
  return `${titleFor(plan)} — ${capitalize(intervalOf(plan))}`;
}
function modalPerks(plan) {
  if (isCorporate(plan?.name)) return PERKS.corporate;
  if (/lifetime|founding/i.test(plan?.name || "")) return PERKS.lifetime;
  return PERKS[tierOf(plan?.name || "")] || [];
}
function groupCorporate(arr) {
  const pickKey = (p) => `${p._corpTier}:${p._interval}`;
  const map = new Map();
  for (const p of arr) if (!map.has(pickKey(p))) map.set(pickKey(p), p);
  return [...map.values()].sort((a, b) => corpRank(a) - corpRank(b));
}
function corpRank(p) {
  const t = p?._corpTier;
  const i = p?._interval;
  const tierOrder = { platinum: 0, gold: 1, silver: 2 };
  const intervalOrder = { annual: 0, monthly: 1 };
  return (tierOrder[t] ?? 9) * 10 + (intervalOrder[i] ?? 5);
}
function sortByTier(a, b) {
  const order = { entry: 0, standard: 1, premium: 2, family: 3 };
  return (order[a._tier] ?? 9) - (order[b._tier] ?? 9);
}
function capitalize(s = "") {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/* -------------------- UI Components -------------------- */
function Accordion({ id, title, children, isOpen = false, onToggle }) {
  const handleSummaryClick = (e) => {
    e.preventDefault();
    onToggle?.();
  };
  return (
    <details open={isOpen} className="grid-card" style={{ padding: 0 }}>
      <summary
        onClick={handleSummaryClick}
        style={{
          cursor: "pointer",
          padding: "14px 16px",
          fontWeight: 700,
          listStyle: "none",
          userSelect: "none",
        }}
        aria-controls={id}
        aria-expanded={isOpen}
      >
        {title}
      </summary>
      <motion.div
        id={id}
        style={{ padding: 16 }}
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.div>
    </details>
  );
}

function PlanCard({ title, perks = [], onJoin, highlight = false }) {
  return (
    <article
      className="grid-card"
      style={{
        border: highlight
          ? "2px solid gold"
          : "1px solid rgba(255,255,255,0.18)",
        boxShadow: highlight ? "0 0 10px rgba(255, 215, 0, 0.35)" : "none",
      }}
    >
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      {perks?.length ? (
        <ul style={{ marginLeft: 18, marginTop: 8 }}>
          {perks.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ul>
      ) : null}
      <div style={{ marginTop: 12 }}>
        <button className="btn" onClick={onJoin}>
          Join Now
        </button>
      </div>
    </article>
  );
}

function MemberPerks() {
  return (
    <section className="section">
      <h2>Member Perks</h2>
      <div className="grid">
        <PerkCard
          title="Free Gallery Admission"
          body="Unlimited access for you (and your +1) to The Church Studio museum & archive."
        />
        <PerkCard
          title="Tunes @ Noon"
          body="Free entry to our weekly lunchtime performance series."
        />
        <PerkCard
          title="The Lounge"
          body="Exclusive access to members-only hangouts, early listening sessions, and Q&As."
        />
        <PerkCard
          title="Tours & Discounts"
          body="Private tour credits and discounts at Harwelden Mansion, Duets B&B, and events."
        />
      </div>
    </section>
  );
}
function PerkCard({ title, body }) {
  return (
    <article className="grid-card">
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      <p>{body}</p>
    </article>
  );
}
function ImpactCard({ title, bullets = [], cta }) {
  return (
    <article className="grid-card">
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      <ul style={{ margin: "8px 0 0 18px" }}>
        {bullets.map((b, i) => (
          <li key={i} style={{ marginBottom: 6 }}>
            {b}
          </li>
        ))}
      </ul>
      {cta && (
        <div style={{ marginTop: 12 }}>
          <a className="btn-ghost" href={cta.href}>
            {cta.label}
          </a>
        </div>
      )}
    </article>
  );
}

function JoinModal({ plan, titleText, perks, onCancel, onConfirm }) {
  const CHURCH_GREEN = "#658D1B";
  const stop = (e) => e.stopPropagation();
  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onCancel}
      onTouchMove={(e) => e.preventDefault()}
      onWheel={(e) => e.preventDefault()}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: 16,
        overscrollBehavior: "contain",
      }}
    >
      <motion.div
        className="grid-card"
        onClick={stop}
        onTouchMove={stop}
        initial={{ opacity: 0, scale: 0.98, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: -8 }}
        transition={{ duration: 0.2 }}
        style={{
          maxWidth: 560,
          width: "100%",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          padding: 0,
          background:
            "linear-gradient(180deg, rgba(20,20,20,0.85), rgba(12,12,12,0.75))",
          color: "rgba(255,255,255,0.95)",
          backdropFilter: "saturate(120%) blur(10px)",
          WebkitBackdropFilter: "saturate(120%) blur(10px)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 24,
          boxShadow:
            "0 10px 30px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset",
        }}
      >
        <div
          style={{
            padding: "18px 22px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <h3 style={{ margin: 0, color: "white" }}>{titleText}</h3>
        </div>
        <div
          style={{
            padding: "18px 22px",
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {perks?.length ? (
            <ul style={{ margin: 0, paddingLeft: 22 }}>
              {perks.map((p, i) => (
                <li key={i} style={{ marginBottom: 10 }}>
                  {p}
                </li>
              ))}
            </ul>
          ) : (
            <p>This plan includes member access and discounts.</p>
          )}
        </div>
        <div
          style={{
            position: "sticky",
            bottom: 0,
            background:
              "linear-gradient(180deg, rgba(18,18,18,0.92), rgba(10,10,10,0.92))",
            backdropFilter: "saturate(130%) blur(8px)",
            WebkitBackdropFilter: "saturate(130%) blur(8px)",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            gap: 12,
            justifyContent: "flex-end",
            alignItems: "center",
            padding: "12px 12px",
            paddingBottom: "max(12px, env(safe-area-inset-bottom))",
            borderBottomLeftRadius: 24,
            borderBottomRightRadius: 24,
          }}
        >
          <button className="btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="btn"
            onClick={onConfirm}
            style={{
              background: CHURCH_GREEN,
              color: "#0B0B0B",
              fontWeight: 800,
              border: "none",
            }}
          >
            Continue to Checkout
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ----------- Skeleton grid for plans ----------- */
function SkeletonPlanGrid() {
  return (
    <div className="grid" aria-hidden="true">
      {Array.from({ length: 4 }).map((_, i) => (
        <div className="grid-card skeleton-card" key={i}>
          <div
            className="skeleton skeleton-text"
            style={{ width: "70%", height: 22 }}
          />
          <div
            className="skeleton skeleton-text"
            style={{ width: "90%", height: 12 }}
          />
          <div
            className="skeleton skeleton-text"
            style={{ width: "85%", height: 12 }}
          />
          <div
            className="skeleton skeleton-text"
            style={{ width: "45%", height: 12 }}
          />
          <div
            className="skeleton btn-skeleton"
            style={{ width: 140, height: 44, marginTop: 12 }}
          />
        </div>
      ))}
    </div>
  );
}

/* ----------- Loading overlay while fetching checkout URL ----------- */
function LoadingOverlay({ message = "Loading…" }) {
  const CHURCH_GREEN = "#658D1B";
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          background: "rgba(12,12,12,0.96)",
          borderRadius: 20,
          padding: "18px 22px",
          border: "1px solid rgba(255,255,255,0.12)",
          minWidth: 260,
          maxWidth: 360,
          textAlign: "center",
          color: "#fff",
          boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
        }}
      >
        <div
          className="loading-overlay-spinner spinning"
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            border: "3px solid rgba(255,255,255,0.25)",
            borderTopColor: CHURCH_GREEN,
            margin: "0 auto 12px",
          }}
        />
        <p style={{ margin: 0, fontWeight: 600 }}>{message}</p>
        <p
          style={{
            marginTop: 6,
            fontSize: "0.9rem",
            opacity: 0.75,
          }}
        >
          This may take just a moment.
        </p>
      </div>
    </div>
  );
}
