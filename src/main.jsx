import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.jsx";
import PortfolioDemoBadge from "./PortfolioDemoBadge.jsx";
import "./styles.css";
import "./components/delivery-address.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
    <PortfolioDemoBadge />
  </React.StrictMode>,
);
