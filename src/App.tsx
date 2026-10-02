/**
 * CLIMASCOPE — Root Application
 * ================================
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { Landing } from './pages/Landing';
import { Analysis } from './pages/Analysis';
import { Validation } from './pages/Validation';
import { History } from './pages/History';
import { Activity, Cpu } from 'lucide-react';
import { USE_MOCKS } from './api/client';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-surface-900 text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200">
        <Navbar />

        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/analyze" element={<Analysis />} />
            <Route path="/validation" element={<Validation />} />
            <Route path="/history" element={<History />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Global Footer */}
        <footer className="border-t border-white/5 py-8 text-xs text-white/40 glass">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center text-white">
                <Activity className="w-3.5 h-3.5" />
              </div>
              <span className="font-semibold text-white/70 tracking-wider">CLIMASCOPE</span>
              <span className="text-white/20">|</span>
              <span>AI Evidence Sufficiency Engine</span>
            </div>

            <div className="flex items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1 text-cyan-400/80">
                <Cpu className="w-3 h-3" />
                PCCOE Grand Challenge 2026
              </span>
              <span className="text-white/20">·</span>
              <span>Theme: AI for Climate Change</span>
              <span className="text-white/20">·</span>
              <span className={`font-mono ${USE_MOCKS ? 'text-amber-400/80' : 'text-emerald-400/80'}`}>
                {USE_MOCKS ? 'Simulated demo data' : 'API-connected mode'}
              </span>
            </div>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
};

export default App;
