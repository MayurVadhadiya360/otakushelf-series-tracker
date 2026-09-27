import { useEffect, useState } from "react";
import useBodyScrollLock from "../hooks/useBodyScrollLock";

/**
 * Themed replacement for window.confirm(), used for anything destructive
 * (deleting a series, deleting a genre). Requires an explicit checkbox
 * acknowledgement before the action button enables — the "extra
 * confirmation step" called for in the requirements.
 */
export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  checkboxLabel = "I understand, proceed",
  danger = true,
  onCancel,
  onConfirm,
}) {
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useBodyScrollLock(open);

  useEffect(() => {
    if (open) {
      setChecked(false);
      setBusy(false);
      setError("");
    }
  }, [open]);

  if (!open) return null;

  async function handleConfirm() {
    setBusy(true);
    setError("");
    try {
      await onConfirm();
    } catch (err) {
      setError(err?.response?.data?.detail || "Something went wrong. Try again.");
      setBusy(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className={`modal-box ${danger ? "modal-danger" : ""}`} onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <p className="modal-message">{message}</p>

        {error && <div className="form-error">{error}</div>}

        <label className="confirm-checkbox">
          <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
          {checkboxLabel}
        </label>

        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button
            className={`btn ${danger ? "btn-danger" : "btn-primary"}`}
            disabled={!checked || busy}
            onClick={handleConfirm}
          >
            {busy ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
