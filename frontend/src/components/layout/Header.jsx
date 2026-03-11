import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import Button from "../common/Button.jsx";
import Modal from "../common/Modal.jsx";
import { downloadLifecycleExport, fetchNotifications } from "../../services/api.js";

export default function Header() {
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const searchRef = useRef(null);
  const notificationsRef = useRef(null);
  const userMenuRef = useRef(null);

  // Fetch notifications
  useEffect(() => {
    const loadNotifications = async () => {
      setNotificationsLoading(true);
      try {
        const data = await fetchNotifications();
        setNotifications(data);
      } catch (error) {
        console.error("Failed to load notifications:", error);
        setNotifications([]);
      } finally {
        setNotificationsLoading(false);
      }
    };
    loadNotifications();
    // Refresh notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/documents?search=${encodeURIComponent(searchQuery)}`);
      setShowSearchResults(false);
    }
  };

  const handleNotificationClick = (notification) => {
    if (notification.lifecycleId || notification.lifecycle_id) {
      const lcId = notification.lifecycleId || notification.lifecycle_id;
      if (notification.type === "risk") {
        navigate(`/predictions/${lcId}`);
      } else {
        navigate(`/lifecycles/${lcId}`);
      }
    }
    setShowNotifications(false);
  };

  const handleExport = async (format) => {
    const currentPath = window.location.pathname;
    
    // Try to extract lifecycle ID from different page types
    let lifecycleId = null;
    
    // Check if on lifecycle page
    const lifecycleMatch = currentPath.match(/\/lifecycles\/([^/]+)/);
    if (lifecycleMatch) {
      lifecycleId = lifecycleMatch[1];
    } else {
      // Check if on predictions page
      const predictionsMatch = currentPath.match(/\/predictions\/([^/]+)/);
      if (predictionsMatch) {
        lifecycleId = predictionsMatch[1];
      }
    }
    
    // If no lifecycle ID found, show error
    if (!lifecycleId) {
      alert("Please navigate to a lifecycle or predictions page to export. Export is only available when viewing a specific lifecycle.");
      setShowExport(false);
      return;
    }

    try {
      const { blob, filename, contentType } = await downloadLifecycleExport(
        lifecycleId,
        format
      );

      const url = window.URL.createObjectURL(new Blob([blob], { type: contentType }));
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setShowExport(false);
    } catch (e) {
      alert(e?.message || "Export failed");
    }
  };

  const handleProfileSettings = () => {
    setShowUserMenu(false);
    setShowProfileSettings(true);
  };

  const handlePreferences = () => {
    setShowUserMenu(false);
    setShowPreferences(true);
  };

  const handleSignOut = () => {
    if (window.confirm("Are you sure you want to sign out?")) {
      setShowUserMenu(false);
      // In a real app, this would clear authentication tokens, session, etc.
      // For now, just show a message and refresh the page
      alert("Signed out successfully. In a production app, you would be redirected to the login page.");
      // Optionally: window.location.href = "/login";
    }
  };

  return (
    <header className="sticky top-0 z-20 border-b border-slate-800/70 bg-slate-950/70 backdrop-blur">
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 md:px-6">
        {/* Left: Logo and Title */}
        <div className="flex-shrink-0 min-w-0">
          <h1 className="text-sm font-semibold tracking-tight text-slate-100 truncate md:text-base">
            Temporal Doc Embeddings
          </h1>
          <p className="hidden text-xs text-slate-500 md:block">
            Lifecycle intelligence & risk analytics
          </p>
        </div>

        {/* Center: Search */}
        <div className="flex flex-1 justify-center max-w-xl mx-2" ref={searchRef}>
          <form onSubmit={handleSearch} className="relative w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchResults(e.target.value.length > 0);
              }}
              onFocus={() => setShowSearchResults(searchQuery.length > 0)}
              placeholder="Search..."
              className="w-full rounded-lg border border-slate-800/80 bg-slate-900/70 px-3 py-1.5 text-sm text-slate-200 placeholder:text-slate-500 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
            />
            {showSearchResults && searchQuery && (
              <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-y-auto rounded-lg border border-slate-800/80 bg-slate-900/95 p-2 shadow-xl">
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      navigate(`/lifecycles?search=${encodeURIComponent(searchQuery)}`);
                      setShowSearchResults(false);
                    }}
                    className="w-full rounded-md border border-slate-800/70 bg-slate-950/40 p-2 text-left text-xs text-slate-300 transition hover:bg-slate-800/60 hover:border-indigo-500/50"
                  >
                    <span className="font-semibold text-indigo-300">Lifecycles:</span>{" "}
                    <span className="text-slate-200">{searchQuery}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      navigate(`/documents?search=${encodeURIComponent(searchQuery)}`);
                      setShowSearchResults(false);
                    }}
                    className="w-full rounded-md border border-slate-800/70 bg-slate-950/40 p-2 text-left text-xs text-slate-300 transition hover:bg-slate-800/60 hover:border-indigo-500/50"
                  >
                    <span className="font-semibold text-indigo-300">Documents:</span>{" "}
                    <span className="text-slate-200">{searchQuery}</span>
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Right: Actions and User */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Export Button - Hidden on small screens */}
          <Button
            className="hidden px-2.5 py-1.5 text-xs md:inline-flex"
            onClick={() => setShowExport(true)}
          >
            Export
          </Button>

          {/* Notifications */}
          <div ref={notificationsRef} className="relative">
            <button
              className="relative rounded-lg border border-slate-800/80 bg-slate-900/70 p-2 text-slate-300 transition hover:border-slate-600 hover:bg-slate-800/50"
              onClick={() => setShowNotifications((prev) => !prev)}
              type="button"
              title="Notifications"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              {notifications.length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-semibold text-white">
                  {notifications.length}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 top-11 z-50 w-72 rounded-xl border border-slate-800/80 bg-slate-900/95 p-3 shadow-xl">
                <div className="mb-2 flex items-center justify-between border-b border-slate-800/70 pb-2">
                  <p className="text-xs font-semibold text-slate-200">
                    Notifications
                  </p>
                  <button
                    className="text-xs text-slate-500 hover:text-slate-300"
                    type="button"
                    onClick={() => setShowNotifications(false)}
                  >
                    ✕
                  </button>
                </div>
                <div className="max-h-80 space-y-2 overflow-y-auto">
                  {notificationsLoading ? (
                    <p className="py-4 text-center text-xs text-slate-500">Loading...</p>
                  ) : notifications.length === 0 ? (
                    <p className="py-4 text-center text-xs text-slate-500">
                      No notifications
                    </p>
                  ) : (
                    notifications.map((note) => (
                      <button
                        key={note.id}
                        type="button"
                        onClick={() => handleNotificationClick(note)}
                        className="w-full rounded-lg border border-slate-800/70 bg-slate-950/40 p-2.5 text-left text-xs text-slate-300 transition hover:border-indigo-500/50 hover:bg-slate-800/40"
                      >
                        <p className="font-semibold text-slate-200">{note.title}</p>
                        <p className="mt-0.5 text-slate-400">{note.detail}</p>
                        <p className="mt-1.5 text-[10px] text-slate-500">{note.time}</p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Environment Badge - Hidden on small screens */}
          <span 
            className={`hidden rounded-md border px-2 py-1 text-[10px] lg:inline-block ${
              window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                : 'border-blue-500/30 bg-blue-500/10 text-blue-200'
            }`}
            title={window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
              ? 'Local Development Environment' 
              : `Environment: ${window.location.hostname}`}
          >
            {window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
              ? 'Local' 
              : 'Production'}
          </span>

          {/* User Menu */}
          <div ref={userMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setShowUserMenu((prev) => !prev)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-800/80 bg-slate-900/70 px-2 py-1.5 transition hover:border-slate-600 hover:bg-slate-800/50"
            >
              <div className="h-6 w-6 rounded-full bg-gradient-to-br from-indigo-500/60 to-purple-500/60" />
              <svg
                className={`h-3 w-3 text-slate-400 transition-transform ${
                  showUserMenu ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {showUserMenu && (
              <div className="absolute right-0 top-11 z-50 w-56 rounded-xl border border-slate-800/80 bg-slate-900/95 p-2 shadow-xl">
                <div className="mb-2 rounded-lg border border-slate-800/70 bg-slate-950/40 px-3 py-2">
                  <p className="text-xs font-semibold text-slate-200">analyst@company.com</p>
                </div>
                <div className="space-y-1">
                  <button
                    type="button"
                    className="w-full rounded-md border border-slate-800/70 bg-slate-950/40 px-3 py-2 text-left text-xs text-slate-300 transition hover:bg-slate-800/60 hover:border-indigo-500/50"
                    onClick={handleProfileSettings}
                  >
                    Profile Settings
                  </button>
                  <button
                    type="button"
                    className="w-full rounded-md border border-slate-800/70 bg-slate-950/40 px-3 py-2 text-left text-xs text-slate-300 transition hover:bg-slate-800/60 hover:border-indigo-500/50"
                    onClick={handlePreferences}
                  >
                    Preferences
                  </button>
                  <div className="border-t border-slate-800/70 pt-1">
                    <button
                      type="button"
                      className="w-full rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-left text-xs text-rose-200 transition hover:bg-rose-500/20"
                      onClick={handleSignOut}
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={showExport}
        title="Export Lifecycle Report"
        onClose={() => setShowExport(false)}
      >
        <div className="space-y-4 text-sm text-slate-300">
          <p>
            Generate a PDF or CSV summary for the active lifecycle.
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            <button
              onClick={() => handleExport("pdf")}
              className="rounded-lg border border-slate-700 bg-slate-950/60 px-4 py-2 text-sm text-slate-200 transition hover:border-indigo-500/50 hover:bg-indigo-500/10"
            >
              Export PDF
            </button>
            <button
              onClick={() => handleExport("csv")}
              className="rounded-lg border border-slate-700 bg-slate-950/60 px-4 py-2 text-sm text-slate-200 transition hover:border-indigo-500/50 hover:bg-indigo-500/10"
            >
              Export CSV
            </button>
          </div>
          <div className="rounded-lg border border-indigo-500/20 bg-indigo-500/10 p-3 text-xs text-indigo-200">
            Reports include lifecycle timeline, risk drivers, and document audit
            trail.
          </div>
        </div>
      </Modal>

      {/* Profile Settings Modal */}
      <Modal
        isOpen={showProfileSettings}
        title="Profile Settings"
        onClose={() => setShowProfileSettings(false)}
      >
        <div className="space-y-4 text-sm text-slate-300">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Email Address
            </label>
            <input
              type="email"
              defaultValue="analyst@company.com"
              className="w-full rounded-lg border border-slate-700/70 bg-slate-950/80 px-3 py-2 text-sm text-slate-200 focus:border-indigo-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Full Name
            </label>
            <input
              type="text"
              defaultValue="Analyst User"
              className="w-full rounded-lg border border-slate-700/70 bg-slate-950/80 px-3 py-2 text-sm text-slate-200 focus:border-indigo-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Department
            </label>
            <input
              type="text"
              defaultValue="Operations"
              className="w-full rounded-lg border border-slate-700/70 bg-slate-950/80 px-3 py-2 text-sm text-slate-200 focus:border-indigo-400 focus:outline-none"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setShowProfileSettings(false)}
              className="flex-1 rounded-lg border border-slate-700 bg-slate-950/60 px-4 py-2 text-sm text-slate-200 transition hover:border-slate-500 hover:bg-slate-800/40"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                alert("Profile settings saved! (In production, this would persist to backend)");
                setShowProfileSettings(false);
              }}
              className="flex-1 rounded-lg border border-indigo-500/50 bg-indigo-500/20 px-4 py-2 text-sm text-indigo-200 transition hover:bg-indigo-500/30"
            >
              Save Changes
            </button>
          </div>
        </div>
      </Modal>

      {/* Preferences Modal */}
      <Modal
        isOpen={showPreferences}
        title="Preferences"
        onClose={() => setShowPreferences(false)}
      >
        <div className="space-y-4 text-sm text-slate-300">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2">
              Theme
            </label>
            <select
              defaultValue="dark"
              className="w-full rounded-lg border border-slate-700/70 bg-slate-950/80 px-3 py-2 text-sm text-slate-200 focus:border-indigo-400 focus:outline-none"
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
              <option value="auto">Auto (System)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2">
              Notifications
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-slate-700 bg-slate-950 text-indigo-500 focus:ring-indigo-500"
                />
                <span className="text-xs text-slate-300">Email notifications</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-slate-700 bg-slate-950 text-indigo-500 focus:ring-indigo-500"
                />
                <span className="text-xs text-slate-300">Risk alerts</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="rounded border-slate-700 bg-slate-950 text-indigo-500 focus:ring-indigo-500"
                />
                <span className="text-xs text-slate-300">Weekly digest</span>
              </label>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2">
              Auto-refresh Interval
            </label>
            <select
              defaultValue="30"
              className="w-full rounded-lg border border-slate-700/70 bg-slate-950/80 px-3 py-2 text-sm text-slate-200 focus:border-indigo-400 focus:outline-none"
            >
              <option value="10">10 seconds</option>
              <option value="30">30 seconds</option>
              <option value="60">1 minute</option>
              <option value="300">5 minutes</option>
            </select>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setShowPreferences(false)}
              className="flex-1 rounded-lg border border-slate-700 bg-slate-950/60 px-4 py-2 text-sm text-slate-200 transition hover:border-slate-500 hover:bg-slate-800/40"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                alert("Preferences saved! (In production, this would persist to backend)");
                setShowPreferences(false);
              }}
              className="flex-1 rounded-lg border border-indigo-500/50 bg-indigo-500/20 px-4 py-2 text-sm text-indigo-200 transition hover:bg-indigo-500/30"
            >
              Save Preferences
            </button>
          </div>
        </div>
      </Modal>
    </header>
  );
}
