import { Outlet, NavLink, useLocation } from "react-router-dom";
import "./Layout.css";

const navItems = [
  { to: "/", label: "Home", icon: "🏠" },
  { to: "/players", label: "Players", icon: "👥" },
];

export default function Layout() {
  const location = useLocation();

  return (
    <div className="layout">
      <header className="layout-header">
        <div className="header-content">
          <h1 className="header-title">
            <span className="header-icon">🏸</span>
            Shuttle Score
          </h1>
        </div>
      </header>

      <main className="layout-main">
        <Outlet />
      </main>

      <nav className="layout-nav" aria-label="Main navigation">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `nav-item ${isActive || (item.to !== "/" && location.pathname.startsWith(item.to)) ? "nav-item--active" : ""}`
            }
            end={item.to === "/"}
            id={`nav-${item.label.toLowerCase()}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}
        <NavLink
            to="/leagues"
            className={({ isActive }) => `nav-item ${isActive || location.pathname.startsWith('/leagues') || location.pathname.startsWith('/seasons') ? "nav-item--active" : ""}`}
            id="nav-leagues"
          >
            <span className="nav-icon" aria-hidden="true">🏟️</span>
            <span className="nav-label">Leagues</span>
          </NavLink>
        <NavLink
          to="/matches"
          className={({ isActive }) => `nav-item ${isActive || location.pathname.startsWith('/matches') ? "nav-item--active" : ""}`}
          id="nav-matches"
        >
          <span className="nav-icon" aria-hidden="true">
            🏸
          </span>
          <span className="nav-label">Matches</span>
        </NavLink>
        <NavLink
          to="/analytics"
          className={({ isActive }) => `nav-item ${isActive ? "nav-item--active" : ""}`}
          id="nav-analytics"
        >
          <span className="nav-icon" aria-hidden="true">📊</span>
          <span className="nav-label">Analytics</span>
        </NavLink>
      </nav>
    </div>
  );
}
