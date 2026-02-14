import { NavLink, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Builder from "./pages/Builder.jsx";
import Results from "./pages/Results.jsx";
import Settings from "./pages/Settings.jsx";

export default function App() {
  return (
    <div className="appShell">
      <header className="topNav">
        <div className="brand">
          <div className="brandMark">BattleBrain</div>
          <div className="brandSub">by Forge &amp; Code</div>
        </div>

        <nav className="navLinks">
          <NavLink to="/builder" className={({ isActive }) => (isActive ? "navItem active" : "navItem")}>
            Builder
          </NavLink>
          <NavLink to="/results" className={({ isActive }) => (isActive ? "navItem active" : "navItem")}>
            Results
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => (isActive ? "navItem active" : "navItem")}>
            Settings
          </NavLink>
        </nav>
      </header>

      <main className="pageWrap">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/builder" element={<Builder />} />
          <Route path="/results" element={<Results />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/builder" replace />} />
        </Routes>
      </main>
    </div>
  );
}
