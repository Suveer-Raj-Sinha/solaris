import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import planetsData from '../../data/planets.json';
import discoveriesData from '../../data/discoveries.json';
import { X, CheckCircle2, Lock, Milestone, User, Cpu, Globe, ExternalLink } from 'lucide-react';
import spaceSoundSynth from '../utils/soundSynth';

export function JournalModal() {
  const journalOpen = useStore((state) => state.journalOpen);
  const setJournalOpen = useStore((state) => state.setJournalOpen);
  const visitedPlanets = useStore((state) => state.visitedPlanets);
  const unlockedDiscoveries = useStore((state) => state.unlockedDiscoveries);
  const completionPercentage = useStore((state) => state.getCompletionPercentage());
  const audioEnabled = useStore((state) => state.audioEnabled);

  // Tab State: 'archive' (Pilot's log) | 'creator' (Creator Profile)
  const [activeTab, setActiveTab] = useState('archive');

  if (!journalOpen) return null;

  const handleClose = () => {
    if (audioEnabled) spaceSoundSynth.playClick();
    setJournalOpen(false);
  };

  return (
    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 md:p-8 animate-fade-in pointer-events-auto">
      {/* Tablet Interface */}
      <div className="relative w-full max-w-4xl h-[80vh] bg-slate-900/90 border border-cyan-500/40 rounded-xl overflow-hidden shadow-[0_0_40px_rgba(6,182,212,0.2)] flex flex-col">
        {/* Futuristic scanline pattern overlay */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_bottom,rgba(255,255,255,0)_95%,rgba(6,182,212,0.05)_95%)] bg-[size:100%_20px] opacity-25"></div>
        
        {/* Header */}
        <div className="flex justify-between items-center bg-slate-950/80 px-6 py-4 border-b border-cyan-500/20">
          <div className="flex items-center gap-3">
            <Milestone className="w-5 h-5 text-cyan-400 animate-pulse" />
            <div>
              <h1 className="text-sm font-mono tracking-widest text-cyan-400 uppercase">SOLARIS NAVIGATIONAL COMPUTER</h1>
              <p className="text-[10px] text-slate-400 font-mono">PILOT'S LOGS & SCIENTIFIC ARCHIVE</p>
            </div>
          </div>
          
          <button 
            onClick={handleClose}
            className="p-1 text-slate-400 hover:text-cyan-400 border border-slate-700 hover:border-cyan-500/50 rounded-md transition-colors bg-slate-950"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar Area */}
        <div className="bg-slate-950/40 px-6 py-4 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex justify-between text-xs font-mono text-cyan-400 mb-1">
              <span>EXPLORATION STATUS</span>
              <span>{completionPercentage}% SECURED</span>
            </div>
            <div className="w-full bg-slate-950 border border-cyan-500/20 h-3 rounded-full overflow-hidden p-[2px]">
              <div 
                className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.5)] transition-all duration-1000 ease-out"
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
          </div>
          <div className="flex gap-6 text-[10px] font-mono text-slate-400">
            <div>
              <div className="text-white text-xs">{visitedPlanets.length} / {planetsData.length}</div>
              WORLDS VISITED
            </div>
            <div>
              <div className="text-white text-xs">{unlockedDiscoveries.length} / {discoveriesData.length}</div>
              DISCOVERIES UNLOCKED
            </div>
          </div>
        </div>

        {/* Futuristic Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/40">
          <button
            onClick={() => {
              if (audioEnabled) spaceSoundSynth.playClick();
              setActiveTab('archive');
            }}
            className={`flex-1 py-3 text-[10px] font-mono tracking-widest uppercase transition-colors border-b-2 ${
              activeTab === 'archive'
                ? 'border-cyan-500 text-cyan-400 bg-cyan-950/10'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/10'
            }`}
          >
            Navigational Archive
          </button>
          <button
            onClick={() => {
              if (audioEnabled) spaceSoundSynth.playClick();
              setActiveTab('creator');
            }}
            className={`flex-1 py-3 text-[10px] font-mono tracking-widest uppercase transition-colors border-b-2 ${
              activeTab === 'creator'
                ? 'border-cyan-500 text-cyan-400 bg-cyan-950/10'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/10'
            }`}
          >
            About the Creator
          </button>
        </div>

        {/* Tab Contents */}
        {activeTab === 'archive' ? (
          /* Navigational Archive / Logs Tab */
          <div className="flex-1 flex flex-col md:flex-row min-h-0">
            {/* Left: Planets Visited Log */}
            <div className="w-full md:w-1/3 border-r border-slate-800 overflow-y-auto p-4 flex flex-col gap-2 bg-slate-900/50">
              <h2 className="text-[11px] font-mono text-cyan-400/80 mb-2 tracking-widest uppercase">NAV-MARKER CHECKLIST</h2>
              {planetsData.map((planet) => {
                const visited = visitedPlanets.includes(planet.id);
                return (
                  <div 
                    key={planet.id} 
                    className={`flex items-center justify-between p-3 border rounded-lg transition-all ${
                      visited 
                        ? 'border-cyan-500/20 bg-cyan-950/10' 
                        : 'border-slate-800 bg-slate-950/30 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span 
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: planet.color }}
                      ></span>
                      <span className="text-sm font-sans font-medium text-slate-100">{planet.name}</span>
                    </div>
                    {visited ? (
                      <div className="flex items-center gap-1 text-[10px] text-cyan-400 font-mono">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>VISITED</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                        <Lock className="w-3 h-3" />
                        <span>LOCKED</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Right: Unlocked Scientific Data */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 bg-slate-900/20">
              <h2 className="text-[11px] font-mono text-cyan-400/80 mb-2 tracking-widest uppercase">DISCOVERED PHENOMENA LOGS</h2>
              
              {unlockedDiscoveries.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-800 rounded-xl">
                  <Lock className="w-12 h-12 text-slate-700 mb-3 animate-pulse" />
                  <h3 className="text-sm font-sans font-semibold text-slate-400 mb-1">Archive Data Encrypted</h3>
                  <p className="text-xs font-mono text-slate-600 max-w-xs">
                    Travel to planets and click on the holographic surface hotspots to decrypt geological and physical discoveries.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {discoveriesData.map((discovery) => {
                    const unlocked = unlockedDiscoveries.includes(discovery.id);
                    if (!unlocked) return null;
                    
                    const planet = planetsData.find(p => p.id === discovery.planetId);

                    return (
                      <div key={discovery.id} className="p-4 bg-slate-950/60 border border-cyan-500/10 rounded-lg flex flex-col gap-2 animate-slide-in">
                        <div className="flex justify-between items-center border-b border-slate-900 pb-1.5">
                          <h3 className="text-sm font-sans font-bold text-cyan-400">{discovery.name}</h3>
                          <span 
                            className="px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider text-slate-300"
                            style={{ border: `1px solid ${planet?.color || '#000'}`, backgroundColor: `${planet?.color || '#000'}15` }}
                          >
                            {planet?.name}
                          </span>
                        </div>
                        <p className="text-xs font-mono text-slate-300 leading-relaxed">
                          {discovery.unlockedText}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* About the Creator Tab */
          <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col items-center justify-center bg-slate-900/10 animate-fade-in">
            <div className="w-full max-w-2xl bg-slate-950/70 border border-cyan-500/30 rounded-xl p-6 md:p-8 flex flex-col md:flex-row gap-8 backdrop-blur-md relative overflow-hidden shadow-[inset_0_0_20px_rgba(6,182,212,0.1)]">
              {/* Decorative cybernetic corners */}
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-400"></div>
              <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyan-400"></div>
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-cyan-400"></div>
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-400"></div>

              {/* Avatar Icon */}
              <div className="flex flex-col items-center gap-3">
                <div className="w-24 h-24 rounded-full border-2 border-cyan-500/40 p-1 bg-slate-900 flex items-center justify-center text-cyan-400 relative">
                  <div className="absolute inset-0.5 rounded-full border border-dashed border-cyan-400/20 animate-[spin_20s_linear_infinite]"></div>
                  <User className="w-12 h-12" />
                </div>
                <span className="text-[9px] font-mono text-cyan-400 px-2 py-0.5 bg-cyan-950/20 border border-cyan-500/20 rounded uppercase tracking-wider">
                  SYS ARCHITECT
                </span>
              </div>

              {/* Details & Mission */}
              <div className="flex-1 flex flex-col gap-4">
                <div>
                  <h2 className="text-lg font-bold text-white tracking-wide">SUVEER RAJ SINHA</h2>
                  <p className="text-[9px] font-mono text-cyan-400/70 uppercase tracking-widest mt-0.5">
                    CS Student & Developer // Solaris Creator
                  </p>
                </div>

                <div className="text-[11px] font-mono text-slate-300 leading-relaxed flex flex-col gap-3 max-h-48 overflow-y-auto pr-1">
                  <p>
                    Hi, I'm <strong className="text-cyan-400">Suveer Raj Sinha</strong>, a final-year Computer Science student and developer with a passion for building experiences that make technology both engaging and meaningful. <strong>Solaris</strong> is one of those projects—a 3D interactive model of our Solar System designed to turn learning about space into an adventure.
                  </p>
                  <p>
                    Instead of reading static facts from a textbook, Solaris lets you travel through the cosmos, explore planets up close, and discover the unique stories behind each celestial body. From the blazing heat of Mercury to the icy mysteries of the outer planets, every stop is an opportunity to spark curiosity and wonder.
                  </p>
                  <p>
                    Built with a love for immersive web experiences and interactive design, Solaris combines education with exploration, inviting everyone to experience the vastness of space in a way that's fun, intuitive, and unforgettable.
                  </p>
                  <p className="text-amber-400 font-bold border-t border-slate-900 pt-2">
                    Because sometimes, the best way to understand the universe is to explore it yourself. 🚀🪐✨
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 border-t border-slate-900 pt-4 font-mono text-[9px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                    <span>R3F & Three.js Engine</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Origin: Earth Sector</span>
                  </div>
                </div>

                {/* Social Badges */}
                <div className="flex flex-wrap gap-2 mt-2">
                  <a
                    href="https://github.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => { if (audioEnabled) spaceSoundSynth.playClick(); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-800 hover:border-cyan-500/50 hover:bg-cyan-950/20 rounded font-mono text-[9px] text-slate-300 hover:text-cyan-400 transition-all"
                  >
                    <ExternalLink className="w-3 h-3" />
                    GITHUB PROFILE
                  </a>
                  <a
                    href="https://portfolio.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => { if (audioEnabled) spaceSoundSynth.playClick(); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-800 hover:border-cyan-500/50 hover:bg-cyan-950/20 rounded font-mono text-[9px] text-slate-300 hover:text-cyan-400 transition-all"
                  >
                    <Globe className="w-3 h-3" />
                    PORTFOLIO PORTAL
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default JournalModal;
