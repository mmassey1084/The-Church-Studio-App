// src/components/DonateModal.jsx
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { openGivebutterCheckout } from "../lib/givebutter";

const AMOUNTS = [25, 50, 100, 500, 1000];

export default function DonateModal({ onClose }) {
  const dialogRef = useRef(null);
  const [freq, setFreq] = useState("one-time");
  const [amount, setAmount] = useState(50);
  const [other, setOther] = useState("");
  const [note, setNote] = useState("");

  const chosenAmount = other ? Number(other) : amount;

  useEffect(() => {
    const prev = document.activeElement;
    dialogRef.current?.focus();
    document.body.classList.add("modal-open");
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      prev?.focus?.();
      document.body.classList.remove("modal-open");
    };
  }, [onClose]);

  async function handleContinue() {
    await openGivebutterCheckout({
      amount: chosenAmount,
      recurring: freq === "monthly" ? "monthly" : "one-time",
      note,
    });
    onClose?.();
  }

  const modal = (
    <div className="donate-modal-backdrop" onClick={onClose}>
      <div
        className="donate-modal"
        onClick={(e) => e.stopPropagation()}
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
      >
        <div className="donate-top">
          <div className="donate-badge">❤</div>
          <button className="donate-x" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <h3 className="donate-title">Support The Church Studio</h3>
        <p className="donate-sub">Secure checkout handled by Givebutter</p>

        <div className="seg-control">
          {["one-time", "monthly"].map((f) => (
            <button
              key={f}
              className={`seg-chip ${freq === f ? "active" : ""}`}
              onClick={() => setFreq(f)}
            >
              {f === "one-time" ? "One-time" : "Monthly"}
            </button>
          ))}
        </div>

        <div className="amount-grid">
          {AMOUNTS.map((a) => (
            <button
              key={a}
              className={`amount-chip ${
                !other && amount === a ? "active" : ""
              }`}
              onClick={() => {
                setAmount(a);
                setOther("");
              }}
            >
              ${a}
            </button>
          ))}
          <div className="other-wrap">
            <label htmlFor="donate-other" className="muted">
              Other
            </label>
            <div className="other-input">
              <span className="currency">$</span>
              <input
                id="donate-other"
                value={other}
                onChange={(e) =>
                  setOther(e.target.value.replace(/[^\d.]/g, ""))
                }
                placeholder="Custom amount"
              />
            </div>
          </div>
        </div>

        <div className="note-wrap">
          <label htmlFor="donate-note" className="muted">
            Add note (optional)
          </label>
          <input
            id="donate-note"
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g., In honor of..."
          />
        </div>

        <button
          className="btn btn-primary w-full donate-cta"
          onClick={handleContinue}
        >
          Continue
        </button>
        <p className="tiny muted donate-foot">
          Apple Pay • Google Pay • Card • ACH · PCI handled by Givebutter
        </p>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
