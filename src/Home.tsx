import React from "react";
import { Link } from "react-router-dom";
import "./Home.css";

export default function Home() {
  return (
    <div className="home-container">
      <h1 className="home-title">Web Crypto Playground</h1>
      <p className="home-subtitle">Choose a demo:</p>
      <ul className="home-links">
        <li>
          <Link to="/hashing">Hashing Demo</Link>
        </li>
        <li>
          <Link to="/webauth">WebAuthn Registration</Link>
        </li>
        <li>
          <Link to="/login">WebAuthn Login</Link>
        </li>
      </ul>
    </div>
  );
}
