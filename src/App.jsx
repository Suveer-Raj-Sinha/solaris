import React from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import SolarSystemScene from './scenes/SolarSystemScene';
import Cockpit from './components/Cockpit';
import SpaceHUD from './components/SpaceHUD';
import EducationalPanel from './components/EducationalPanel';
import JournalModal from './components/JournalModal';
import PhotoModeUI from './components/PhotoModeUI';
import AudioController from './components/AudioController';

// Silence Three.js soft shadow map deprecation warning globally by passing the type directly below

export function App() {
  return (
    <main className="relative w-full h-full bg-[#020617] overflow-hidden select-none">
      
      {/* 1. 3D WebGL Canvas Layer */}
      <div className="absolute inset-0 z-0 w-full h-full">
        <Canvas
          shadows={{ type: THREE.PCFShadowMap }}
          gl={{ 
            preserveDrawingBuffer: true, // Crucial for Photo Mode canvas exports
            antialias: true
          }}
          camera={{ 
            position: [0, 35, 75], 
            fov: 55, 
            near: 0.1, 
            far: 1000 
          }}
        >
          <SolarSystemScene />
        </Canvas>
      </div>

      {/* 2. Interactive Audio Driver */}
      <AudioController />

      {/* 3. Futuristic UI Overlay HUDs */}
      <Cockpit />
      <SpaceHUD />
      <EducationalPanel />
      <JournalModal />
      <PhotoModeUI />

    </main>
  );
}

export default App;
