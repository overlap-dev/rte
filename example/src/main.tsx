import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
// CSS direkt aus dem Quellverzeichnis importieren (für Development)
// In Production: import 'hendriks-rte/dist/styles.css';
import "../../src/styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
