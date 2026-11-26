import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@elea/ds/styles.css";
import { App } from "./app/App";
import { initTheme } from "./theme/theme";

initTheme();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
