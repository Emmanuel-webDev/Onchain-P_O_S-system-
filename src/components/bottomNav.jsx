// BottomNav.jsx
import { useEffect } from "react";

export function BottomNav({ activeTab, onTab }) {
  return (
    <nav className="bottom-nav">
      <button
        className={`nav-tab ${activeTab === "basket" ? "active" : ""}`}
        onClick={() => onTab("basket")}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 01-8 0" />
        </svg>
        <span>New Sale</span>
        <div className="nav-tab__indicator" />
      </button>
      <button
        className={`nav-tab ${activeTab === "history" ? "active" : ""}`}
        onClick={() => onTab("history")}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <span>History</span>
        <div className="nav-tab__indicator" />
      </button>
    </nav>
  );
}

export default BottomNav;