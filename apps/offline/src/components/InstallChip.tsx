import { useEffect, useState } from "react";
import { usePwaInstall } from "../lib/install-prompt.ts";

const DISMISS_KEY = "roc-trainer:install-dismissed";

function readDismissed(): boolean {
  try {
    return window.localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

function writeDismissed(): void {
  try {
    window.localStorage.setItem(DISMISS_KEY, "1");
  } catch {
    // Private-mode Safari etc. — we just won't remember the dismissal.
  }
}

export function InstallChip() {
  const { mode, install } = usePwaInstall();
  const [dismissed, setDismissed] = useState<boolean>(() => readDismissed());
  const [iosOpen, setIosOpen] = useState(false);

  useEffect(() => {
    if (!iosOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIosOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [iosOpen]);

  if (mode === "none" || dismissed) return null;

  const handleClick = async () => {
    if (mode === "ios-instructions") {
      setIosOpen(true);
      return;
    }
    const outcome = await install();
    if (outcome === "accepted") setDismissed(true);
  };

  const handleDismiss = () => {
    setDismissed(true);
    writeDismissed();
  };

  return (
    <>
      <div className="install-chip" role="region" aria-label="Install this app">
        <button
          type="button"
          className="install-chip-button"
          onClick={handleClick}
          aria-haspopup={mode === "ios-instructions" ? "dialog" : undefined}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 4v12m0 0l-5-5m5 5l5-5M5 20h14"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>Install app</span>
        </button>
        <button
          type="button"
          className="install-chip-dismiss"
          onClick={handleDismiss}
          aria-label="Dismiss install prompt"
          title="Dismiss"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {iosOpen ? (
        <div
          className="install-modal-backdrop"
          onClick={() => setIosOpen(false)}
          role="presentation"
        >
          <div
            className="install-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="install-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="install-modal-title" className="install-modal-title">
              Add to Home Screen
            </h2>
            <ol className="install-modal-steps">
              <li>
                Tap the <strong>Share</strong> icon
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                  className="install-modal-icon"
                >
                  <path
                    d="M12 3v12m0-12l-4 4m4-4l4 4M5 13v6a2 2 0 002 2h10a2 2 0 002-2v-6"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                in Safari&rsquo;s toolbar.
              </li>
              <li>
                Choose <strong>Add to Home Screen</strong>.
              </li>
              <li>
                Tap <strong>Add</strong> in the upper-right corner.
              </li>
            </ol>
            <button type="button" className="install-modal-close" onClick={() => setIosOpen(false)}>
              Got it
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
