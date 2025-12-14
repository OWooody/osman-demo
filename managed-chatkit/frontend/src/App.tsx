import { useState, useEffect } from "react";
import { ChatKitPanel } from "./components/ChatKitPanel";

// Warm color palette constants
const WARM_COLORS = {
  primary: "#E07A5F",
  gold: "#F2CC8F",
  cream: "#FAF7F2",
  gray700: "#4A453D",
  gray800: "#2D2A25",
};

export default function App() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-color-scheme', isDark ? 'dark' : 'light');
  }, [isDark]);

  return (
    <main className="min-h-screen flex items-center justify-center">
      {/* Dark mode toggle - Warm styling */}
      <button
        onClick={() => setIsDark(!isDark)}
        className="fixed top-5 right-5 z-50 p-3 rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95"
        style={{
          background: isDark ? WARM_COLORS.gray800 : WARM_COLORS.cream,
          boxShadow: isDark
            ? '0 4px 16px rgba(0, 0, 0, 0.3)'
            : '0 4px 16px rgba(45, 42, 37, 0.1)',
          border: `1px solid ${isDark ? WARM_COLORS.gray700 : '#E8E2D9'}`,
        }}
        aria-label="Toggle dark mode"
      >
        {isDark ? (
          <svg
            className="w-5 h-5 dark-toggle-icon rotate"
            fill="currentColor"
            viewBox="0 0 20 20"
            style={{ color: WARM_COLORS.gold }}
          >
            <path
              fillRule="evenodd"
              d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          <svg
            className="w-5 h-5 dark-toggle-icon"
            fill="currentColor"
            viewBox="0 0 20 20"
            style={{ color: WARM_COLORS.primary }}
          >
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
          </svg>
        )}
      </button>

      <ChatKitPanel />
    </main>
  );
}
