import React from 'react';
import { useStore } from '../store/useStore';
import planetsData from '../../data/planets.json';
import spaceSoundSynth from '../utils/soundSynth';
import { 
  Volume2, VolumeX, Milestone, Camera, Info, Home, 
  ChevronLeft, ChevronRight, Eye, Send, RotateCcw 
} from 'lucide-react';

export function SpaceHUD() {
  const gamePhase = useStore((state) => state.gamePhase);
  const setGamePhase = useStore((state) => state.setGamePhase);
  const selectedPlanet = useStore((state) => state.selectedPlanet);
  const activePlanet = useStore((state) => state.activePlanet);
  const selectPlanet = useStore((state) => state.selectPlanet);
  const startTravel = useStore((state) => state.startTravel);
  const returnToHub = useStore((state) => state.returnToHub);
  const visitedPlanets = useStore((state) => state.visitedPlanets);
  const unlockedDiscoveries = useStore((state) => state.unlockedDiscoveries);
  const audioEnabled = useStore((state) => state.audioEnabled);
  const toggleAudioEnabled = useStore((state) => state.toggleAudioEnabled);
  const journalOpen = useStore((state) => state.journalOpen);
  const setJournalOpen = useStore((state) => state.setJournalOpen);
  const photoMode = useStore((state) => state.photoMode);
  const togglePhotoMode = useStore((state) => state.togglePhotoMode);
  const educationalMode = useStore((state) => state.educationalMode);
  const toggleEducationalMode = useStore((state) => state.toggleEducationalMode);
  
  // Guided Tour
  const guidedTourActive = useStore((state) => state.guidedTourActive);
  const tourStep = useStore((state) => state.tourStep);
  const nextTourStep = useStore((state) => state.nextTourStep);
  const prevTourStep = useStore((state) => state.prevTourStep);
  const exitGuidedTour = useStore((state) => state.exitGuidedTour);
  
  const completionPercentage = useStore((state) => state.getCompletionPercentage());

  // Dynamic Physics controls & moon hooks
  const orbitSpeedFactor = useStore((state) => state.orbitSpeedFactor);
  const setOrbitSpeedFactor = useStore((state) => state.setOrbitSpeedFactor);
  const showOrbitLines = useStore((state) => state.showOrbitLines);
  const toggleOrbitLines = useStore((state) => state.toggleOrbitLines);
  const showLabels = useStore((state) => state.showLabels);
  const toggleLabels = useStore((state) => state.toggleLabels);
  const activeMoon = useStore((state) => state.activeMoon);
  const clearMoon = useStore((state) => state.clearMoon);

  if (gamePhase === 'landing' || gamePhase === 'countdown' || gamePhase === 'launch') return null;
  if (photoMode) return null; // Hide everything during photo mode

  const handleSelectPlanet = (planetId) => {
    if (audioEnabled) spaceSoundSynth.playClick();
    selectPlanet(planetId);
  };

  const handleWarp = () => {
    if (!selectedPlanet) return;
    if (audioEnabled) {
      spaceSoundSynth.playClick();
    }
    startTravel(selectedPlanet.id);
  };

  const handleJournalToggle = () => {
    if (audioEnabled) spaceSoundSynth.playClick();
    setJournalOpen(!journalOpen);
  };

  const handleReturnToCockpit = () => {
    if (audioEnabled) spaceSoundSynth.playClick();
    setGamePhase('landing');
  };

  const handleReturnToMap = () => {
    if (audioEnabled) spaceSoundSynth.playClick();
    returnToHub();
  };

  return (
    <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-between p-6 scanlines">
      
      {/* 1. TOP BAR HUD (System status & persistent widgets) */}
      <div className="w-full flex justify-between items-center pointer-events-auto bg-slate-950/75 border border-cyan-500/20 px-6 py-3 rounded-lg backdrop-blur-md shadow-lg">
        
        {/* Left: Completion progress meter */}
        <div className="flex flex-col gap-1 w-72">
          <div className="flex justify-between text-[10px] font-mono text-cyan-400">
            <span>SECTOR SURVEY: {completionPercentage}%</span>
            <span>{visitedPlanets.length} / {planetsData.length} SECURED</span>
          </div>
          <div className="w-full bg-slate-950/60 border border-cyan-500/20 h-2 rounded-full overflow-hidden p-[1px]">
            <div 
              className="h-full bg-cyan-500 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Center: Pilot navigation info */}
        <div className="hidden lg:flex flex-col items-center">
          <span className="text-xs font-mono tracking-widest text-white font-bold uppercase text-glow">
            {gamePhase === 'orbit' && activePlanet ? (activeMoon ? `MOON ORBIT: ${activeMoon.name.toUpperCase()}` : `ORBITING: ${activePlanet.name.toUpperCase()}`) : 'SOLAR SYSTEM HUB'}
          </span>
          <span className="text-[8px] font-mono text-cyan-400/70">
            COORDINATES // RANGE: <span id="hud-telemetry-distance" className="text-white font-bold font-sans">0.00 AU</span> // STATUS: ONLINE
          </span>
        </div>

        {/* Right: Audio / Journal / Cockpit triggers */}
        <div className="flex items-center gap-3">
          {/* Audio */}
          <button
            onClick={toggleAudioEnabled}
            className={`p-2 rounded border border-slate-800 transition-colors ${
              audioEnabled ? 'text-cyan-400 border-cyan-500/30 bg-cyan-950/20' : 'text-slate-500 hover:border-slate-700'
            }`}
          >
            {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Journal */}
          <button
            onClick={handleJournalToggle}
            disabled={gamePhase === 'travel'}
            className={`flex items-center gap-2 px-3 py-1.5 border rounded font-mono text-[10px] transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
              journalOpen ? 'border-cyan-500 bg-cyan-950/30 text-cyan-400' : 'border-slate-800 text-slate-300 hover:border-cyan-500/50 disabled:hover:border-slate-800'
            }`}
          >
            <Milestone className="w-4 h-4 text-cyan-400" />
            JOURNAL
          </button>

          {/* Return Cockpit */}
          <button
            onClick={handleReturnToCockpit}
            disabled={gamePhase === 'travel'}
            className="p-2 border border-slate-800 hover:border-cyan-500/50 disabled:hover:border-slate-800 disabled:opacity-40 disabled:cursor-not-allowed rounded text-slate-300 hover:text-cyan-400 transition-colors bg-slate-950"
            title="Dock to Cockpit"
          >
            <Home className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. MIDDLE AREA VIEW (Left/Right side overlays) */}
      <div className="flex-1 w-full flex justify-between items-center my-6 min-h-0">
        
        {/* ================= LEFT SIDE ================= */}
        {gamePhase === 'orbit' && activePlanet ? (
          activeMoon ? (
            /* Left Side: Orbit Moon Detail Board */
            <div className="pointer-events-auto w-80 h-full max-h-[60vh] bg-slate-950/70 border border-amber-500/30 rounded-lg p-5 flex flex-col justify-between backdrop-blur-md shadow-lg animate-slide-in border-glow-amber">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-0.5 border-b border-amber-500/20 pb-2">
                  <span className="text-[9px] font-mono text-amber-500 uppercase tracking-widest">PARENT PLANET: {activePlanet.name.toUpperCase()}</span>
                  <h2 className="text-xl font-bold text-white tracking-wide">{activeMoon.name.toUpperCase()}</h2>
                </div>
                
                <p className="text-[11px] font-mono text-slate-300 leading-relaxed max-h-36 overflow-y-auto pr-1">
                  {activeMoon.description}
                </p>

                <div className="border-t border-slate-900 pt-3 flex flex-col gap-2 font-mono text-[9px] text-slate-300">
                  <div className="flex justify-between"><span>RADIUS:</span><span className="text-amber-400">{activeMoon.radius || 'N/A'}</span></div>
                  <div className="flex justify-between"><span>ORBIT PERIOD:</span><span className="text-amber-400">{activeMoon.orbitalPeriod || 'N/A'}</span></div>
                  <div className="flex justify-between"><span>GRAVITY:</span><span className="text-amber-400">{activeMoon.gravity || 'N/A'}</span></div>
                  <div className="flex justify-between"><span>TEMPERATURE:</span><span className="text-amber-400">{activeMoon.temperature || 'N/A'}</span></div>
                </div>
              </div>

              <button
                onClick={clearMoon}
                className="mt-4 w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 border border-amber-500/40 hover:border-amber-400 text-amber-400 font-mono text-[10px] font-bold py-2 rounded transition-colors"
              >
                RETURN TO PLANET FOCUS
              </button>
            </div>
          ) : (
            /* Left Side: Orbit Planet Detail Board */
            <div className="pointer-events-auto w-80 h-full max-h-[60vh] bg-slate-950/70 border border-cyan-500/20 rounded-lg p-5 flex flex-col justify-between backdrop-blur-md shadow-lg animate-slide-in">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-0.5 border-b border-cyan-500/20 pb-2">
                  <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-widest">{activePlanet.tagline}</span>
                  <h2 className="text-xl font-bold text-white tracking-wide">{activePlanet.name}</h2>
                </div>
                
                <p className="text-[11px] font-mono text-slate-300 leading-relaxed max-h-36 overflow-y-auto pr-1">
                  {activePlanet.description}
                </p>
              </div>

              {/* Hotspots checklist */}
              <div className="mt-4 flex-1 flex flex-col gap-2 min-h-0 overflow-y-auto border-t border-slate-900 pt-3">
                <span className="text-[9px] font-mono text-cyan-400/80 tracking-widest uppercase">Geological Hotspots:</span>
                <div className="flex flex-col gap-1.5 mt-1">
                  {activePlanet.hotspots?.map((hotspot) => {
                    const unlocked = unlockedDiscoveries.includes(hotspot.discoveryId);
                    return (
                      <div 
                        key={hotspot.id} 
                        className={`flex items-center gap-2 p-2 border rounded font-mono text-[9px] ${
                          unlocked 
                            ? 'border-cyan-500/10 bg-cyan-950/10 text-cyan-400' 
                            : 'border-slate-800 text-slate-500'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${unlocked ? 'bg-cyan-400' : 'bg-slate-700 animate-pulse'}`}></span>
                        <span className="flex-1 truncate">{hotspot.name}</span>
                        <span>{unlocked ? 'DECRYPTED' : 'UNEXPLORED'}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={handleReturnToMap}
                className="mt-4 w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 hover:border-cyan-400 text-cyan-400 font-mono text-[10px] font-bold py-2 rounded transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                RETURN TO SYSTEM MAP
              </button>
            </div>
          )
        ) : gamePhase === 'hub' ? (
          /* Left Side: Physics control panel in Hub View */
          <div className="pointer-events-auto w-80 h-full max-h-[55vh] bg-slate-950/70 border border-cyan-500/20 rounded-lg p-5 flex flex-col gap-4 backdrop-blur-md shadow-lg animate-slide-in">
            <div className="border-b border-cyan-500/20 pb-2">
              <h3 className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">PHYSICS SIMULATION</h3>
              <p className="text-[8px] font-mono text-slate-400">WARP TIME & ADJUST HUD LAYOUT</p>
            </div>
            
            {/* Time Warp Buttons */}
            <div className="flex flex-col gap-2">
              <span className="text-[9px] font-mono text-cyan-400/80 uppercase tracking-widest">Time Speed Factor:</span>
              <div className="grid grid-cols-4 gap-1.5 font-mono text-[10px]">
                {['0x', '1x', '10x', '50x'].map((speedStr) => {
                  const factor = parseFloat(speedStr);
                  const isCurrent = orbitSpeedFactor === factor;
                  return (
                    <button
                      key={speedStr}
                      onClick={() => {
                        if (audioEnabled) spaceSoundSynth.playClick();
                        setOrbitSpeedFactor(factor);
                      }}
                      className={`py-1.5 border rounded font-bold text-center transition-colors ${
                        isCurrent 
                          ? 'border-cyan-500 bg-cyan-950/30 text-cyan-400' 
                          : 'border-slate-800 text-slate-400 hover:border-slate-600 hover:text-white'
                      }`}
                    >
                      {speedStr.toUpperCase()}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Toggle Toggles */}
            <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-slate-900">
              <span className="text-[9px] font-mono text-cyan-400/80 uppercase tracking-widest">DISPLAY LAYOUT:</span>
              
              {/* Orbit Lines Toggle */}
              <button
                onClick={() => {
                  if (audioEnabled) spaceSoundSynth.playClick();
                  toggleOrbitLines();
                }}
                className={`w-full flex items-center justify-between p-2.5 border rounded font-mono text-[10px] transition-colors ${
                  showOrbitLines 
                    ? 'border-cyan-500/30 bg-cyan-950/10 text-cyan-400 font-bold' 
                    : 'border-slate-900 hover:border-slate-800 text-slate-500'
                }`}
              >
                <span>SHOW ORBIT LINES</span>
                <span>{showOrbitLines ? 'ENABLED' : 'DISABLED'}</span>
              </button>

              {/* Labels Toggle */}
              <button
                onClick={() => {
                  if (audioEnabled) spaceSoundSynth.playClick();
                  toggleLabels();
                }}
                className={`w-full flex items-center justify-between p-2.5 border rounded font-mono text-[10px] transition-colors ${
                  showLabels 
                    ? 'border-cyan-500/30 bg-cyan-950/10 text-cyan-400 font-bold' 
                    : 'border-slate-900 hover:border-slate-800 text-slate-500'
                }`}
              >
                <span>SHOW PLANET LABELS</span>
                <span>{showLabels ? 'ENABLED' : 'DISABLED'}</span>
              </button>
            </div>
          </div>
        ) : (
          /* Left Side: General HUD status overlays (Empty in Hub view for clutter-free look) */
          <div className="w-1"></div>
        )}

        {/* ================= RIGHT SIDE ================= */}
        {gamePhase === 'hub' && (
          /* Right Side: Navigation panel in Hub View */
          <div className="pointer-events-auto w-80 h-full max-h-[65vh] bg-slate-950/70 border border-cyan-500/20 rounded-lg p-5 flex flex-col gap-4 backdrop-blur-md shadow-lg animate-slide-in">
            <div className="border-b border-cyan-500/20 pb-2">
              <h3 className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">NAVIGATION LOG</h3>
              <p className="text-[8px] font-mono text-slate-400">SELECT TARGET DESTINATION</p>
            </div>
            
            {/* Planets scroll list */}
            <div className="flex-1 overflow-y-auto flex flex-col gap-1 pr-1">
              {planetsData.map((planet) => {
                const visited = visitedPlanets.includes(planet.id);
                const isCurrentSelected = selectedPlanet?.id === planet.id;
                
                return (
                  <button
                    key={planet.id}
                    onClick={() => handleSelectPlanet(planet.id)}
                    className={`w-full flex items-center justify-between p-2 rounded border font-mono text-[10px] transition-colors ${
                      isCurrentSelected
                        ? 'border-cyan-500 bg-cyan-950/20 text-cyan-400 font-bold'
                        : 'border-slate-900/60 hover:border-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span 
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: planet.color }}
                      ></span>
                      <span>{planet.name.toUpperCase()}</span>
                    </div>
                    <span className="text-[8px] text-slate-500">
                      {visited ? 'VISITED' : 'UNEXPLORED'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Target lock card */}
            {selectedPlanet && (
              <div className="border border-cyan-500/20 bg-slate-950/60 rounded p-3 flex flex-col gap-2 animate-slide-in">
                <div className="flex justify-between items-center text-[9px] font-mono text-cyan-400 uppercase">
                  <span>Target locked</span>
                  <span className="h-1.5 w-1.5 bg-cyan-400 rounded-full animate-ping"></span>
                </div>
                <div className="text-sm font-sans font-bold text-white leading-tight">
                  {selectedPlanet.name}
                </div>
                <div className="text-[9px] font-mono text-slate-400 leading-normal">
                  {selectedPlanet.tagline}
                </div>
                
                <button
                  onClick={handleWarp}
                  className="w-full flex items-center justify-center gap-2 mt-1 bg-cyan-600 hover:bg-cyan-500 text-white font-sans text-xs font-bold py-2 rounded shadow-md transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  ENGAGE WARP ENGINE
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. BOTTOM PANEL HUD (Tour trackers & toggle switches) */}
      <div className="w-full flex flex-col md:flex-row justify-between items-center gap-4">
        
        {/* Guided Tour Navigator */}
        {guidedTourActive ? (
          <div className="pointer-events-auto bg-slate-950/90 border border-amber-500/30 p-3 rounded-lg flex items-center gap-6 backdrop-blur-md shadow-[0_0_15px_rgba(245,158,11,0.1)] border-glow-amber">
            <div className="text-left font-mono">
              <div className="text-[8px] text-amber-500 uppercase tracking-widest">Autopilot Guided Tour</div>
              <div className="text-xs text-white font-bold">
                Step {tourStep + 1} / {planetsData.length} ({planetsData[tourStep]?.name})
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={prevTourStep}
                disabled={tourStep === 0 || gamePhase === 'travel'}
                className="p-1.5 border border-slate-800 hover:border-amber-500/40 rounded text-slate-400 hover:text-amber-400 disabled:opacity-40 disabled:hover:border-slate-800 disabled:hover:text-slate-400 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <button
                onClick={nextTourStep}
                disabled={gamePhase === 'travel'}
                className="flex items-center gap-1.5 px-3 py-1 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold font-mono text-[10px] rounded transition-colors"
              >
                <span>{tourStep === planetsData.length - 1 ? 'FINISH' : 'NEXT'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              
              <button
                onClick={exitGuidedTour}
                disabled={gamePhase === 'travel'}
                className="text-[9px] font-mono text-red-400 hover:text-red-300 disabled:opacity-40 disabled:cursor-not-allowed ml-2"
              >
                Exit Tour
              </button>
            </div>
          </div>
        ) : (
          <div className="w-1"></div>
        )}

        {/* View Mode Controllers (Right-bottom corner) */}
        <div className="pointer-events-auto bg-slate-950/80 border border-cyan-500/20 p-2.5 rounded-lg flex items-center gap-3 backdrop-blur-md shadow-md">
          {/* Toggle Educational Mode */}
          {gamePhase === 'orbit' && (
            <button
              onClick={toggleEducationalMode}
              className={`flex items-center gap-1.5 px-3 py-1.5 border rounded font-mono text-[9px] transition-colors ${
                educationalMode 
                  ? 'border-cyan-500 bg-cyan-950/20 text-cyan-400 font-bold' 
                  : 'border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Info className="w-3.5 h-3.5" />
              PHYSICAL SHEET
            </button>
          )}

          {/* Toggle Photo Mode */}
          <button
            onClick={togglePhotoMode}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-800 hover:border-cyan-500/50 rounded font-mono text-[9px] text-slate-400 hover:text-cyan-400 transition-colors"
          >
            <Camera className="w-3.5 h-3.5" />
            PHOTO VIEW
          </button>
        </div>
      </div>
    </div>
  );
}

export default SpaceHUD;
