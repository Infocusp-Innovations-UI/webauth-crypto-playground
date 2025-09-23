import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HashFlow from "./routes/hashing/HashFlow";
import Home from "./routes/home/Home";
import WebAuthnRegistration from "./routes/registration/WebAuthnRegistration";
import "./index.css";
import WebAuthnLogin from "./routes/login/WebAuthnLogin";
import { UserProvider } from "./context/UserContext";
import WebAuthnLoginFlow from "./routes/login/WebAuthnLoginFlow";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter>
      <UserProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/hashing" element={<HashFlow />} />
          <Route path="/registration" element={<WebAuthnRegistration />} />
          <Route path="/login" element={<WebAuthnLoginFlow />} />
        </Routes>
      </UserProvider>
    </BrowserRouter>
  </StrictMode>
);
