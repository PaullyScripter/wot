import React from "react"
import ReactDOM from "react-dom/client"
import App from "./app"

// ── Mobile / tablet detection ─────────────────────────────────────────────────
// We check both touch capability and screen width.  Anything narrower than
// 1024 px, or a pure touch-only device, is flagged as unsupported.
const isMobileOrTablet =
  /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
  ("ontouchstart" in window && navigator.maxTouchPoints > 1) ||
  window.innerWidth < 1024;

if (isMobileOrTablet) {
  console.error(
    "%c[WOT] Device not supported",
    "color:#ff4444;font-weight:bold;font-size:14px",
  );
  console.error(
    "%cWOT Online is designed for desktop and laptop computers.\n" +
    "Please switch to a desktop PC or laptop for the best experience.\n" +
    "Screen width detected: " + window.innerWidth + "px",
    "color:#ff8800;font-size:12px",
  );
}

// Instantly cover the page with black if this is a first visit (not a refresh)
// so the teal desktop never flashes before the splash renders
if (!sessionStorage.getItem("wot_booted")) {
  document.documentElement.style.background = "#000";
  document.body.style.background = "#000";
}

// ── Render ────────────────────────────────────────────────────────────────────

// We always render the app; the unsupported-device overlay is injected
// INSIDE the splash screen (see App.tsx SplashScreen component).
// We pass the flag down via a global so App can read it without prop-drilling.
(window as Window & { __wotMobileUnsupported?: boolean }).__wotMobileUnsupported =
  isMobileOrTablet;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)