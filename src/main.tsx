import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HashFlow from "./HashFlow";
import Home from "./Home";
import WebAuthnRegistration from "./WebAuthnRegistration";
import "./index.css";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/hasing" element={<HashFlow />} />
        <Route path="/webauth" element={<WebAuthnRegistration />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
