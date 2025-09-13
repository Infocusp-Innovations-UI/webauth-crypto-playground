import React from "react";
import { Link } from "react-router-dom";
import "./Header.css";

export default function Header() {
  return (
    <header className="header-container">
      <nav className="header-nav">
        <ul className="header-links">
          <li>
            <Link to="/hashing">Hashing Demo</Link>
          </li>
          <li>
            <Link to="/registration">WebAuthn Registration</Link>
          </li>
          <li>
            <Link to="/login">WebAuthn Login</Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}
