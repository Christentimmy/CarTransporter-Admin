import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// if ("serviceWorker" in navigator) {
//   window.addEventListener("load", () => {
//     navigator.serviceWorker
//       .register("/service-worker")
//       .then(() => {
//         console.log("✅ Pusher Beams service worker registered");
//       })
//       .catch((err) => {
//         console.error("❌ Service worker registration failed", err);
//       });
//   });
// }


createRoot(document.getElementById("root")!).render(<App />);
