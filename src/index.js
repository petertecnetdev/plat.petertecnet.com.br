import React from "react";
import ReactDOM from "react-dom/client";
import axios from "axios";
import App from "./App";
import { GoogleOAuthProvider } from "@react-oauth/google";
import PeterTecnetSignature from "./components/PeterTecnetSignature";
import "bootstrap/dist/css/bootstrap.min.css";
import "./LegacyTheme.css";
import "./pages/establishment/Management.css";
import "./Responsive.css";
import "./PeterAppTheme.css";

axios.defaults.headers.common["X-Peter-App"] = "plat";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
      <App />
      <PeterTecnetSignature />
    </GoogleOAuthProvider>
  </React.StrictMode>
);
