import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import spaceSoundSynth from '../utils/soundSynth';

export function AudioController() {
  const audioEnabled = useStore((state) => state.audioEnabled);
  const gamePhase = useStore((state) => state.gamePhase);

  // Sync mute state with Zustand store
  useEffect(() => {
    spaceSoundSynth.setMute(!audioEnabled);
  }, [audioEnabled]);

  // Play travel warp sound effect when starting space travel
  useEffect(() => {
    if (audioEnabled && gamePhase === 'travel') {
      spaceSoundSynth.playWarpSweep(0.4, 3.6);
    }
  }, [gamePhase, audioEnabled]);

  return null;
}

export default AudioController;
