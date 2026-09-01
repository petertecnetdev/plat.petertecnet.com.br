import { startTelemetry } from "./telemetry";
import { apiBaseUrl, appId, appSlug } from "./config";
import React from "react";
import ReactDOM from "react-dom/client";
import axios from "axios";
import App from "./App";
import { GoogleOAuthProvider } from "@react-oauth/google";
import PeterTecnetSignature from "./components/PeterTecnetSignature";
import PeterAccountGateway from "./components/PeterAccountGateway";
import "bootstrap/dist/css/bootstrap.min.css";
import "./LegacyTheme.css";
import "./pages/establishment/Management.css";
import "./Responsive.css";
import "./PeterAppTheme.css";
import "./PlatLayoutSystem.css";
import "./PlatPolish.css";

startTelemetry({ apiBaseUrl, appSlug, appId });

axios.defaults.headers.common["X-Peter-App"] = appSlug;
axios.defaults.headers.common["X-App-ID"] = String(appId);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <PeterAccountGateway apiBaseUrl={apiBaseUrl} appSlug={appSlug}>
      <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
        <App />
        <PeterTecnetSignature />
      </GoogleOAuthProvider>
    </PeterAccountGateway>
  </React.StrictMode>
);
