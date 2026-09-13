import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router";
import App from "./App.jsx";
import "./styles/theme.css";

/* HashRouter لا BrowserRouter: الموقع منشور على GitHub Pages التي
   تعيد 404 لأي مسار عميق ما لم تُستعمل حيلة 404.html. المسارات
   بعلامة # تعمل دون أي إعداد على الخادم. */
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>
);
