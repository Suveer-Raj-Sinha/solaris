import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../store/useStore';
import Sun from '../planets/Sun';
import ProceduralPlanet from '../planets/ProceduralPlanet';
import AsteroidBelt from '../planets/AsteroidBelt';
import CameraController from './CameraController';
import PostEffects from './PostEffects';
import planetsData from '../../data/planets.json';

// Futuristic Hyperspace Warp Speed Trails
function WarpLines() {
  const meshRef = useRef();
  const gamePhase = useStore((state) => state.gamePhase);
  const count = 150;

  // Initialize random particle lines coordinates relative to camera viewport
  const lines = useMemo(() => {
    const data = [];
    for (let i = 0; i < count; i++) {
      data.push({
        x: (Math.random() - 0.5) * 40,
        y: (Math.random() - 0.5) * 40,
        z: Math.random() * 80 - 40,
        speed: 6.0 + Math.random() * 6.0,
        length: 0.8 + Math.random() * 1.5
      });
    }
    return data;
  }, []);

  const tempObject = useMemo(() => new THREE.Object3D(), []);

  useFrame((state, delta) => {
    if (!meshRef.current || gamePhase !== 'travel') return;

    // Follow camera position and orientation so lines fly directly at the screen
    meshRef.current.position.copy(state.camera.position);
    meshRef.current.quaternion.copy(state.camera.quaternion);

    lines.forEach((line, i) => {
      // Warp speed makes lines fly forward along Z-axis (towards screen)
      line.z += line.speed * 6.5 * delta * 60;
      
      // Reset once they pass camera plane
      if (line.z > 30) {
        line.z = -50;
        line.x = (Math.random() - 0.5) * 40;
        line.y = (Math.random() - 0.5) * 40;
      }

      tempObject.position.set(line.x, line.y, line.z);
      // Stretch scale along Z axis during warp acceleration
      tempObject.scale.set(0.04, 0.04, line.length * 16.0);
      tempObject.updateMatrix();
      
      meshRef.current.setMatrixAt(i, tempObject.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]} visible={gamePhase === 'travel'}>
      <boxGeometry args={[1, 1, 1]} />
      {/* Additive blending makes lines look like glowing energy trails */}
      <meshBasicMaterial 
        color="#22d3ee" 
        transparent={true} 
        opacity={0.7} 
        blending={THREE.AdditiveBlending} 
      />
    </instancedMesh>
  );
}

export function SolarSystemScene() {
  const gamePhase = useStore((state) => state.gamePhase);
  const activePlanet = useStore((state) => state.activePlanet);
  const photoMode = useStore((state) => state.photoMode);
  const orbitSpeedFactor = useStore((state) => state.orbitSpeedFactor);
  const showOrbitLines = useStore((state) => state.showOrbitLines);

  // Increment the global orbitTime in the R3F frame loop, scaled by physics warp factor
  useFrame((state, delta) => {
    if (gamePhase === 'hub' && !photoMode) {
      useStore.setState((prev) => ({ 
        orbitTime: prev.orbitTime + delta * 12.0 * prev.orbitSpeedFactor 
      }));
    }
  });

  // Filter planets (excluding the Sun, which is rendered separately at origin)
  const planetsList = useMemo(() => {
    return planetsData.filter(p => p.id !== 'sun');
  }, []);

  const sunData = useMemo(() => {
    return planetsData.find(p => p.id === 'sun');
  }, []);

  return (
    <>
      {/* 1. Camera System */}
      <CameraController />

      {/* 2. Environmental Lighting */}
      <ambientLight intensity={gamePhase === 'landing' ? 0.4 : 0.02} />
      <directionalLight position={[12, 8, 8]} intensity={1.8} castShadow />

      {/* 3. Deep Space Background Starfield */}
      <Stars 
        radius={120} 
        depth={60} 
        count={6000} 
        factor={6} 
        saturation={0.5} 
        fade={true} 
        speed={1} 
      />

      {/* 4. Warp Speeds Particle System */}
      <WarpLines />

      {/* 5. Astronomical Bodies */}
      {/* In orbit mode, we only render the active planet centered at [0,0,0] for maximum frame stability */}
      {gamePhase === 'orbit' && activePlanet ? (
        activePlanet.id === 'sun' ? (
          <Sun size={sunData.size} />
        ) : (
          <ProceduralPlanet planet={activePlanet} />
        )
      ) : (
        // In landing/hub/travel mode, render the entire Solar System
        <group>
          {sunData && <Sun size={sunData.size} />}
          
          {/* Orbit Lines centered around the Sun */}
          {gamePhase === 'hub' && showOrbitLines && planetsList.map((planet) => (
            <mesh key={`orbit-line-${planet.id}`} rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[planet.orbitRadius - 0.04, planet.orbitRadius + 0.04, 128]} />
              <meshBasicMaterial color="#06b6d4" opacity={0.12} transparent={true} side={THREE.DoubleSide} />
            </mesh>
          ))}

          {planetsList.map((planet) => (
            <ProceduralPlanet key={planet.id} planet={planet} />
          ))}
          <AsteroidBelt />
        </group>
      )}

      {/* 6. Post Processing Visual Effects */}
      <PostEffects />
    </>
  );
}

export default SolarSystemScene;
