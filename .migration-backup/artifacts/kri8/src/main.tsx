import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setBaseUrl } from "@workspace/api-client-react";

// In production (Vercel), point the API client at the Render backend.
// In dev, leave empty so relative paths hit Vite's /api proxy (localhost:5000).
const apiBase = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "";
setBaseUrl(apiBase || null);

createRoot(document.getElementById("root")!).render(<App />);
