import React, { useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function CheckoutCallback() {
  const loc = useLocation();
  const nav = useNavigate();
  const params = useMemo(() => new URLSearchParams(loc.search), [loc.search]);
  const status = (params.get("status") || "").toLowerCase();

  useEffect(() => {
    try {
      // Let other parts of app know we returned (simple flag)
      localStorage.setItem("checkout:lastStatus", status || "unknown");
    } catch {}

    // If this opened in a popup/tab, try to close it after a brief pause
    const t = setTimeout(() => {
      if (window.opener) {
        window.close(); // allowed if user-initiated flow
      } else {
        // Navigate the SPA home/membership after 1.5s
        nav("/backstage-pass", { replace: true });
      }
    }, 1500);
    return () => clearTimeout(t);
  }, [status, nav]);

  return (
    <motion.main
      className="page"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.24, ease: "easeOut" }}
    >
      <h1 className="page-title">Checkout</h1>
      {status === "success" ? (
        <article className="grid-card" aria-live="polite">
          <h3 style={{ marginTop: 0 }}>Thank you! 🎉</h3>
          <p>Your membership checkout finished successfully.</p>
          <p>You’ll be redirected shortly.</p>
        </article>
      ) : status === "cancel" ? (
        <article className="grid-card" aria-live="polite">
          <h3 style={{ marginTop: 0 }}>Checkout canceled</h3>
          <p>No worries—you're returning to the membership page.</p>
        </article>
      ) : (
        <article className="grid-card" aria-live="polite">
          <h3 style={{ marginTop: 0 }}>Returning from checkout…</h3>
          <p>We’re processing your status. You’ll be redirected shortly.</p>
        </article>
      )}
    </motion.main>
  );
}
