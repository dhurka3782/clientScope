import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Analytics - only loads if VITE_ANALYTICS_ENDPOINT is configured
const analyticsEndpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT as string | undefined;
const analyticsWebsiteId = import.meta.env.VITE_ANALYTICS_WEBSITE_ID as string | undefined;

if (analyticsEndpoint && analyticsWebsiteId) {
  const script = document.createElement("script");
  script.src = `${analyticsEndpoint}/umami`;
  script.setAttribute("data-website-id", analyticsWebsiteId);
  script.defer = true;
  document.head.appendChild(script);
}

createRoot(document.getElementById("root")!).render(<App />);
