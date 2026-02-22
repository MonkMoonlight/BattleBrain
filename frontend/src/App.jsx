import { NavLink, Routes, Route, Navigate } from "react-router-dom";
import { useLocation } from "react-router-dom";

import logo from "./assets/battlebrain-logo.png";
import Login from "./pages/Login.jsx";
import Builder from "./pages/Builder.jsx";
import Settings from "./pages/Settings.jsx";

export default function App() {
  const location = useLocation();
  const hideNav = location.pathname === "/login";

  return (
    <div className="appShell">
      
      {!hideNav && (
        <header className="topNav">
          {/* Left: Brand + Logo */}
          <div className="brand">
            <img className="brandLogo" src={logo} alt="BattleBrain logo" />
            <div>
              <div className="brandMark">BattleBrain</div>
              <div className="brandSub">by Forge &amp; Code</div>
            </div>
          </div>

          {/* Right: Navigation */}
          <nav className="navLinks">
            <NavLink
              to="/builder"
              className={({ isActive }) => (isActive ? "navItem active" : "navItem")}
            >
              Builder
            </NavLink>

            <NavLink
              to="/settings"
              className={({ isActive }) => (isActive ? "navItem active" : "navItem")}
            >
              Settings
            </NavLink>
          </nav>
        </header>
      )}

      {/* Page content */}
      <main className="pageWrap">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/builder" element={<Builder />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/builder" replace />} />
        </Routes>
      </main>
    </div>
  );
}
