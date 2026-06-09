import React from 'react';
import { useStore } from '../store/useStore';
import { Camera, X } from 'lucide-react';
import spaceSoundSynth from '../utils/soundSynth';

export function PhotoModeUI() {
  const photoMode = useStore((state) => state.photoMode);
  const togglePhotoMode = useStore((state) => state.togglePhotoMode);
  const audioEnabled = useStore((state) => state.audioEnabled);

  if (!photoMode) return null;

  const handleCapture = () => {
    if (audioEnabled) spaceSoundSynth.playClick();
    
    // Select the R3F Canvas element
    const canvas = document.querySelector('canvas');
    if (!canvas) {
      console.warn("R3F Canvas not found for screenshot");
      return;
    }

    try {
      // Create snapshot link
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `solaris_${new Date().toISOString().slice(0,19).replace(/[-:]/g, "")}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error("Failed to capture screenshot:", e);
    }
  };

  const handleExit = () => {
    if (audioEnabled) spaceSoundSynth.playClick();
    togglePhotoMode();
  };

  return (
    <div className="absolute inset-0 z-40 pointer-events-none flex flex-col justify-between p-8">
      {/* Top HUD */}
      <div className="flex justify-between items-start w-full animate-fade-in">
        <div className="bg-slate-950/70 border border-cyan-500/20 px-4 py-2 rounded font-mono text-[10px] text-cyan-400 backdrop-blur-sm">
          CAM_REC_MODE // [60 FPS] // AUTO_FOCUS: ON
        </div>
        <button
          onClick={handleExit}
          className="pointer-events-auto flex items-center gap-2 bg-slate-950/70 border border-red-500/30 hover:border-red-500 px-3 py-1.5 rounded font-mono text-[10px] text-red-400 hover:text-red-300 transition-colors backdrop-blur-sm"
        >
          <X className="w-3.5 h-3.5" />
          EXIT PHOTO MODE
        </button>
      </div>

      {/* Viewfinder brackets overlay */}
      <div className="flex-1 w-full flex items-center justify-center relative">
        <div className="absolute top-12 left-12 w-8 h-8 border-t-2 border-l-2 border-cyan-500/40"></div>
        <div className="absolute top-12 right-12 w-8 h-8 border-t-2 border-r-2 border-cyan-500/40"></div>
        <div className="absolute bottom-12 left-12 w-8 h-8 border-b-2 border-l-2 border-cyan-500/40"></div>
        <div className="absolute bottom-12 right-12 w-8 h-8 border-b-2 border-r-2 border-cyan-500/40"></div>
        
        {/* Center reticle */}
        <div className="w-4 h-4 border border-cyan-500/20 rounded-full flex items-center justify-center">
          <div className="w-1 h-1 bg-cyan-500/30 rounded-full"></div>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="w-full flex justify-center items-center animate-fade-in">
        <div className="bg-slate-950/80 border border-cyan-500/30 p-4 rounded-xl flex items-center gap-6 backdrop-blur-md pointer-events-auto shadow-[0_0_20px_rgba(6,182,212,0.1)]">
          <div className="text-left font-mono text-[9px] text-slate-400 max-w-[150px]">
            Drag mouse to rotate. Scroll to zoom. HUD is hidden for cinematic capture.
          </div>
          
          <button
            onClick={handleCapture}
            className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white font-sans text-xs font-bold px-5 py-2.5 rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all transform hover:scale-105"
          >
            <Camera className="w-4 h-4" />
            CAPTURE CHASSIS
          </button>
        </div>
      </div>
    </div>
  );
}

export default PhotoModeUI;
