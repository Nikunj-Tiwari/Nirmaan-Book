import React, { useEffect } from 'react';
import { useConfig } from '../store/ConfigContext';

export const Viewer = () => {
  const { config, derived } = useConfig();
  const { modules, material } = config;
  const { totalModules } = derived;

  // Ready to accept data later
  useEffect(() => {
    if (modules && Object.keys(modules).length > 0) {
      console.log('3D Viewer State Synchronized:', { modules, material });
    }
  }, [modules, material]);

  return (
    <div className="flex-1 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border)] flex items-center justify-center relative overflow-hidden group min-h-[450px] shadow-lg">
      {/* Background Decor (Architectural Grid) */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      ></div>

      <div className="text-center z-10 flex flex-col items-center gap-8 p-12">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-[var(--accent)]/10 flex items-center justify-center border border-[var(--accent)]/30 text-[var(--accent)] shadow-2xl animate-pulse">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
          </div>
          {/* Pulsing Outer Ring */}
          <div className="absolute inset-[-10px] rounded-full border border-[var(--accent)]/10 animate-ping opacity-20"></div>
        </div>

        <div className="flex flex-col gap-3">
          <h4 className="text-2xl font-black text-[var(--text-primary)] uppercase tracking-tight">
            3D Visualization
          </h4>
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-[var(--accent)] text-white text-[10px] font-black uppercase tracking-[2px] mx-auto shadow-md">
            Coming Soon
          </div>
          <p className="text-[12px] font-medium text-[var(--text-secondary)] mt-4 max-w-xs mx-auto leading-relaxed uppercase tracking-widest opacity-60">
            Integrating Three.js engine for real-time high-fidelity architectural projection.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full max-w-sm mt-4">
          <div className="bg-[var(--bg-primary)] p-5 rounded-xl border border-[var(--border)] flex flex-col items-center shadow-sm">
            <span className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-[2px] mb-2 opacity-50">
              State Payload
            </span>
            <span className="text-sm font-black text-[var(--accent)]">{totalModules} UNITS</span>
          </div>
          <div className="bg-[var(--bg-primary)] p-5 rounded-xl border border-[var(--border)] flex flex-col items-center shadow-sm">
            <span className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-[2px] mb-2 opacity-50">
              Texture Atlas
            </span>
            <span className="text-sm font-black text-[var(--text-primary)]">
              {material?.name.toUpperCase()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Viewer;
