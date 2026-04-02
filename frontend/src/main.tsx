import React from "react"
import ReactDOM from "react-dom/client"
import App from "./app"

// Instantly cover the page with black if this is a first visit (not a refresh)
// so the teal desktop never flashes before the splash renders
if (!sessionStorage.getItem("wot_booted")) {
  document.documentElement.style.background = "#000";
  document.body.style.background = "#000";
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)