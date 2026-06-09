import React from 'react';
import { useStore } from '../store/useStore';

export function EducationalPanel() {
  const activePlanet = useStore((state) => state.activePlanet);
  const educationalMode = useStore((state) => state.educationalMode);

  if (!educationalMode || !activePlanet) return null;

  const { facts, name } = activePlanet;

  return (
    <div className="absolute right-6 top-24 w-80 bg-slate-950/70 border border-cyan-500/30 backdrop-blur-md rounded-lg p-6 shadow-[0_0_15px_rgba(6,182,212,0.15)] text-slate-100 flex flex-col gap-4 animate-slide-in pointer-events-auto">
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
        <h3 className="font-mono text-xs uppercase tracking-widest text-cyan-400">Telemetry Data</h3>
        <span className="h-1.5 w-1.5 bg-cyan-400 rounded-full animate-ping"></span>
      </div>

      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold tracking-wide text-white font-sans">{name}</h2>
        <p className="text-[10px] font-mono text-cyan-400/70 uppercase">Astrophysical Specifications</p>
      </div>

      <div className="flex flex-col gap-3 font-mono text-xs mt-2">
        <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
          <span className="text-slate-400">Orbital Distance</span>
          <span className="text-cyan-300 text-right">{facts.distance}</span>
        </div>
        
        <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
          <span className="text-slate-400">Mean Radius</span>
          <span className="text-cyan-300 text-right">{facts.radius}</span>
        </div>

        <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
          <span className="text-slate-400">Moons Count</span>
          <span className="text-cyan-300 text-right">{facts.moons}</span>
        </div>

        <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
          <span className="text-slate-400">Orbital Period</span>
          <span className="text-cyan-300 text-right">{facts.orbitalPeriod}</span>
        </div>

        <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
          <span className="text-slate-400">Rotation Period</span>
          <span className="text-cyan-300 text-right">{facts.rotationPeriod}</span>
        </div>

        <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
          <span className="text-slate-400">Surface Gravity</span>
          <span className="text-cyan-300 text-right">{facts.gravity}</span>
        </div>

        <div className="flex justify-between items-center py-1.5">
          <span className="text-slate-400">Temp Range</span>
          <span className="text-cyan-300 text-right">{facts.temperature}</span>
        </div>
      </div>

      {/* Cybernetic telemetry lines */}
      <div className="flex justify-between text-[8px] font-mono text-slate-500 mt-2 border-t border-slate-800 pt-3">
        <span>SYS.OK: SOLARIS_v1.0</span>
        <span>SECTOR: 04-SOL</span>
      </div>
    </div>
  );
}

export default EducationalPanel;
