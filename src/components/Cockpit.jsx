import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import spaceSoundSynth from '../utils/soundSynth';
import factsData from '../../data/facts.json';
import { Volume2, VolumeX, Rocket, Compass, Navigation } from 'lucide-react';

export function Cockpit() {
  const gamePhase = useStore((state) => state.gamePhase);
  const setGamePhase = useStore((state) => state.setGamePhase);
  const audioEnabled = useStore((state) => state.audioEnabled);
  const toggleAudioEnabled = useStore((state) => state.toggleAudioEnabled);
  const startGuidedTour = useStore((state) => state.startGuidedTour);

  const [countdown, setCountdown] = useState(3);
  const [factIndex, setFactIndex] = useState(0);

  // Rotate interesting space facts on cockpit console screens
  useEffect(() => {
    const interval = setInterval(() => {
      setFactIndex((prev) => (prev + 1) % factsData.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // Trigger countdown sequence
  useEffect(() => {
    if (gamePhase !== 'countdown') return;

    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
        if (audioEnabled) spaceSoundSynth.playClick();
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // Countdown completed, ignite engines!
      if (audioEnabled) {
        spaceSoundSynth.playWarpSweep(1.0, 3.5);
      }
      setGamePhase('launch');
    }
  }, [gamePhase, countdown, setGamePhase, audioEnabled]);

  if (gamePhase !== 'landing' && gamePhase !== 'countdown' && gamePhase !== 'launch') return null;

  const handleStartMission = () => {
    if (audioEnabled) spaceSoundSynth.playClick();
    setCountdown(3);
    setGamePhase('countdown');
  };

  const handleFreeExplore = () => {
    if (audioEnabled) spaceSoundSynth.playClick();
    setGamePhase('hub');
  };

  const handleGuidedTour = () => {
    if (audioEnabled) spaceSoundSynth.playClick();
    startGuidedTour();
  };

  const handleAudioToggle = () => {
    // Standard browser constraint: AudioContext must be initiated by user action
    toggleAudioEnabled();
  };

  return (
    <div className="absolute inset-0 z-30 pointer-events-none flex flex-col justify-between p-6 scanlines">
      {/* 1. Cockpit Top Shielding & Header */}
      <div className="w-full flex justify-between items-center bg-slate-950/80 border-b border-cyan-500/20 px-6 py-3 backdrop-blur-sm shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        <div className="flex flex-col">
          <h1 className="text-sm font-mono tracking-widest text-cyan-400 font-bold uppercase text-glow">
            SOLARIS EXPLORATION VESSEL
          </h1>
          <p className="text-[9px] font-mono text-slate-400">CLASS: ORBITER // ID: NX-2026</p>
        </div>
        
        {/* Ambient Audio Toggle */}
        <button
          onClick={handleAudioToggle}
          className={`pointer-events-auto flex items-center gap-2 border px-3 py-1.5 rounded-md font-mono text-[10px] transition-all ${
            audioEnabled
              ? 'border-cyan-500 bg-cyan-950/20 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
              : 'border-slate-800 bg-slate-950 text-slate-500 hover:border-slate-600'
          }`}
        >
          {audioEnabled ? (
            <>
              <Volume2 className="w-3.5 h-3.5 animate-pulse" />
              <span>AUDIO: ACTIVE</span>
            </>
          ) : (
            <>
              <VolumeX className="w-3.5 h-3.5" />
              <span>AUDIO: MUTED</span>
            </>
          )}
        </button>
      </div>

      {/* 2. Cockpit Windshield Frames / Viewfinder overlay */}
      <div className="flex-1 w-full flex items-center justify-center relative">
        {gamePhase === 'landing' && (
          <div className="text-center bg-slate-950/40 px-6 py-3 rounded-lg border border-cyan-500/10 backdrop-blur-xs max-w-sm">
            <h2 className="text-xs font-mono text-cyan-400 uppercase tracking-widest mb-1">Cockpit HUD Locked</h2>
            <p className="text-[9px] font-mono text-slate-400">Initiate launch commands or select tour mode below</p>
          </div>
        )}

        {/* Big Countdown Overlay */}
        {gamePhase === 'countdown' && (
          <div className="flex flex-col items-center justify-center animate-pulse">
            <div className="font-mono text-6xl font-bold text-cyan-400 text-glow">
              {countdown > 0 ? `0${countdown}` : "IGNITION"}
            </div>
            <div className="text-[10px] font-mono text-orange-400 uppercase tracking-widest mt-2">
              WARNING: SYSTEM ENGINE THRUST DETECTED
            </div>
          </div>
        )}

        {/* Engine ignition flame visual overlay (Friction on atmosphere exit) */}
        {gamePhase === 'launch' && (
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-orange-600/30 via-red-600/5 to-transparent animate-pulse flex flex-col justify-end items-center pb-12">
            <div className="font-mono text-sm font-bold text-orange-500 tracking-wider text-glow-orange animate-bounce">
              EXITING EARTH ATMOSPHERE...
            </div>
          </div>
        )}

        {/* Full-screen chromatic distortion overlay during launch */}
        {gamePhase === 'launch' && (
          <div className="absolute inset-0 z-20 pointer-events-none bg-red-950/10 mix-blend-color-dodge animate-pulse scanlines"></div>
        )}

        {/* Left Side Cockpit Terminal Panel */}
        {(gamePhase === 'landing' || gamePhase === 'launch' || gamePhase === 'countdown') && (
          <div className={`absolute left-4 w-72 bg-slate-950/70 border border-cyan-500/10 rounded-lg p-4 font-mono text-[9px] text-slate-300 flex flex-col gap-3 backdrop-blur-md shadow-[0_0_20px_rgba(0,0,0,0.5)] transition-all ${
            gamePhase === 'launch' ? 'border-red-500/40 text-red-200 shadow-[0_0_15px_rgba(239,68,68,0.2)] border-glow-red' : ''
          }`}>
            <div className={`border-b pb-1 flex justify-between font-bold uppercase text-[10px] ${
              gamePhase === 'launch' ? 'border-red-500/20 text-red-400' : 'border-cyan-500/20 text-cyan-400'
            }`}>
              <span>Reactor Status</span>
              {gamePhase === 'launch' ? (
                <span className="text-red-500 animate-ping">CRITICAL_LOAD</span>
              ) : (
                <span className="text-emerald-400 animate-pulse">SYS_OK</span>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between">
                <span>THRUST CORE:</span>
                <span className={gamePhase === 'launch' ? 'text-red-400 font-bold' : 'text-cyan-400'}>
                  {gamePhase === 'launch' ? '120.00% OVERDRIVE' : '100.00%'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>G-FORCE LOAD:</span>
                <span className={gamePhase === 'launch' ? 'text-red-400 font-bold' : 'text-cyan-400'}>
                  {gamePhase === 'launch' ? '4.8G (ACCEL)' : '1.0G (EARTH)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>VELOCITY:</span>
                <span className={gamePhase === 'launch' ? 'text-red-400 font-bold' : 'text-cyan-400'}>
                  {gamePhase === 'launch' ? '11,200 m/s (ESCAPE)' : '0 m/s (STATIC)'}
                </span>
              </div>
            </div>
            <div className="border-t border-slate-900 pt-2 flex flex-col gap-1">
              <span className={`text-[8px] uppercase ${gamePhase === 'launch' ? 'text-red-400/80' : 'text-cyan-400/70'}`}>
                {gamePhase === 'launch' ? 'ALTITUDE STRATOSPHERE:' : 'Revolving Star Map Data:'}
              </span>
              <span className="text-slate-400 leading-normal">
                {gamePhase === 'launch' ? 'HEIGHT: 85.4 km // ACC: +45.2 m/s² // PRESSURE: drop' : 'DEC: +29° 12\' 4.3" // RA: 04h 31m 11.2s // DISTANCE: 0.00 AU'}
              </span>
            </div>
          </div>
        )}

        {/* Right Side Cockpit Terminal Panel */}
        {(gamePhase === 'landing' || gamePhase === 'launch' || gamePhase === 'countdown') && (
          <div className={`absolute right-4 w-72 bg-slate-950/70 border border-cyan-500/10 rounded-lg p-4 font-mono text-[9px] text-slate-300 flex flex-col gap-3 backdrop-blur-md shadow-[0_0_20px_rgba(0,0,0,0.5)] transition-all ${
            gamePhase === 'launch' ? 'border-red-500/40 text-red-200 shadow-[0_0_15px_rgba(239,68,68,0.25)] border-glow-red' : ''
          }`}>
            <div className={`border-b pb-1 font-bold uppercase text-[10px] ${
              gamePhase === 'launch' ? 'border-red-500/20 text-red-400' : 'border-cyan-500/20 text-cyan-400'
            }`}>
              <span>{gamePhase === 'launch' ? 'IGNITION FLIGHT FEED' : 'Mission Control logs'}</span>
            </div>
            <div className="h-24 overflow-y-auto leading-relaxed flex flex-col gap-2 pr-1">
              {gamePhase === 'launch' ? (
                <div className="text-red-400 font-bold flex flex-col gap-1.5">
                  <span className="animate-pulse">&gt;&gt;&gt; SOLID ROCKET BOOSTERS IGNITED</span>
                  <span>&gt;&gt;&gt; TRAJECTORY ANGLE LOCKED AT 12.5°</span>
                  <span className="text-amber-500">&gt;&gt;&gt; MAX-Q PRESSURE POINT REACHED</span>
                  <span className="text-emerald-400 animate-pulse">&gt;&gt;&gt; SCIENTIFIC INSTRUMENTS CALIBRATED</span>
                </div>
              ) : (
                <>
                  <div className="text-cyan-400/80">FACT DATABASE DETECTED:</div>
                  <p className="text-slate-400 leading-normal">
                    "{factsData[factIndex]}"
                  </p>
                </>
              )}
            </div>
            <div className="border-t border-slate-900 pt-2 text-[8px] text-slate-500 flex justify-between">
              <span>DB_REF: {gamePhase === 'launch' ? 'SRB_FIRE_99' : 'SOL_026'}</span>
              <span>INDEX: {gamePhase === 'launch' ? 'TELEMETRY LIVE' : `${factIndex + 1}/${factsData.length}`}</span>
            </div>
          </div>
        )}
      </div>

      {/* 3. Cockpit Controls / Pilot Dash */}
      {gamePhase === 'landing' && (
        <div className="w-full max-w-3xl mx-auto bg-slate-950/90 border border-cyan-500/30 rounded-xl p-6 shadow-[0_0_30px_rgba(6,182,212,0.15)] backdrop-blur-md flex flex-col md:flex-row justify-between items-center gap-6 pointer-events-auto border-glow">
          <div className="text-center md:text-left flex flex-col gap-1">
            <h2 className="text-sm font-sans font-bold tracking-wider text-white">READY FOR MISSION INITIATION</h2>
            <p className="text-[10px] font-mono text-cyan-400 uppercase">Select navigation mode to launch vessel</p>
          </div>
          
          <div className="flex flex-wrap justify-center items-center gap-3">
            {/* Start Mission */}
            <button
              onClick={handleStartMission}
              className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white font-sans text-xs font-bold px-5 py-2.5 rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all transform hover:scale-105"
            >
              <Rocket className="w-4 h-4" />
              START MISSION
            </button>

            {/* Free Explore */}
            <button
              onClick={handleFreeExplore}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 hover:border-cyan-400 text-cyan-400 font-sans text-xs font-bold px-5 py-2.5 rounded-lg transition-all transform hover:scale-105"
            >
              <Compass className="w-4 h-4" />
              FREE EXPLORE
            </button>

            {/* Guided Tour */}
            <button
              onClick={handleGuidedTour}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-amber-500/40 hover:border-amber-400 text-amber-400 font-sans text-xs font-bold px-5 py-2.5 rounded-lg transition-all transform hover:scale-105"
            >
              <Navigation className="w-4 h-4" />
              GUIDED TOUR
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Cockpit;
