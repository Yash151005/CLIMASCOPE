/**
 * CLIMASCOPE — Navbar Component
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Activity, Sun, Moon, Menu, X } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';
import { USE_MOCKS } from '../../api/client';

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/analyze', label: 'Analyze' },
  { to: '/validation', label: 'Validation' },
  { to: '/history', label: 'History' },
];

export const Navbar: React.FC = () => {
  const location = useLocation();
  const { theme, toggle } = useThemeStore();
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <nav
      className="glass sticky top-0 z-50 border-b border-white/5"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5 group"
            aria-label="CLIMASCOPE Home"
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-shadow">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-widest text-white/90">
                CLIMASCOPE
              </span>
              <span className="text-[10px] text-white/40 tracking-wider -mt-0.5">
                EVIDENCE ENGINE
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-white/10 text-cyan-300'
                      : 'text-white/60 hover:text-white/90 hover:bg-white/5'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            <span
              className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${
                USE_MOCKS
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              }`}
              title={USE_MOCKS ? 'Running with simulated data' : 'Connected to the configured API'}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                  USE_MOCKS ? 'bg-amber-400' : 'bg-emerald-400'
                }`}
              />
              {USE_MOCKS ? 'Mock Data' : 'Live API'}
            </span>

            {/* Theme toggle */}
            <button
              onClick={toggle}
              className="p-2 rounded-lg text-white/50 hover:text-white/90 hover:bg-white/5 transition-colors"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </button>

            {/* Mobile menu */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-lg text-white/50 hover:text-white/90"
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden border-t border-white/5 px-4 py-3 space-y-1">
          {NAV_LINKS.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-white/10 text-cyan-300'
                    : 'text-white/60 hover:text-white/90 hover:bg-white/5'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
};
