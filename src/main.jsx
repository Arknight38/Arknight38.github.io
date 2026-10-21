import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./app/styles.css";
import "./app/theme.css";
import App from "./app/App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
