import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { textureGenerator } from '../utils/textureGenerator';
import { useStore } from '../store/useStore';

// Custom Fresnel Glow Shader for Sun's Corona Halo
const SunCoronaShader = {
  uniforms: {
    uGlowColor: { value: new THREE.Color('#f97316') }, // Deep orange
    uGlowPower: { value: 1.15 }, // Lower value makes the glow fade out very gradually over a wide radius
    uGlowIntensity: { value: 0.85 } // Lower intensity keeps the gradual dissipation soft and smooth
  },
  vertexShader: `
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    void main() {
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -mvPosition.xyz;
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    uniform vec3 uGlowColor;
    uniform float uGlowPower;
    uniform float uGlowIntensity;
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    void main() {
      vec3 normal = normalize(vNormal);
      vec3 viewDir = normalize(vViewPosition);
      
      // Fresnel calculation: brighter at grazing angles
      float intensity = pow(1.0 - dot(normal, viewDir), uGlowPower) * uGlowIntensity;
      gl_FragColor = vec4(uGlowColor, intensity);
    }
  `
};

export function Sun({ size = 5.0 }) {
  const meshRef = useRef();
  const coronaMeshRef = useRef();

  const gamePhase = useStore((state) => state.gamePhase);

  // Load high-resolution Sun texture map from NASA (served from cache)
  const sunTexture = useMemo(() => {
    return textureGenerator.getPlanetTexture('sun');
  }, []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    // Slow self-rotation for Sun core mesh
    if (meshRef.current) {
      meshRef.current.rotation.y = time * 0.012;
    }

    // Slowly shift texture coordinates to simulate boiling solar activity and plasma currents
    if (sunTexture) {
      sunTexture.offset.x = time * 0.004;
      sunTexture.offset.y = Math.sin(time * 0.01) * 0.015;
    }

    // Slowly pulsate the corona size
    if (coronaMeshRef.current) {
      const pulse = 1.0 + Math.sin(time * 1.5) * 0.02;
      coronaMeshRef.current.scale.set(pulse, pulse, pulse);
    }
  });

  return (
    <group name="sun">
      {/* 1. Main Sun Mesh (mapped with NASA solar details) */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[size, 64, 64]} />
        <meshBasicMaterial 
          map={sunTexture} 
          toneMapped={false} // Prevents lighting engine from washing out the glowing core
        />
      </mesh>

      {/* 2. Glow Corona Mesh (Slightly larger, transparent Fresnel glow) */}
      <mesh ref={coronaMeshRef}>
        <sphereGeometry args={[size * 1.25, 32, 32]} />
        <shaderMaterial
          vertexShader={SunCoronaShader.vertexShader}
          fragmentShader={SunCoronaShader.fragmentShader}
          uniforms={SunCoronaShader.uniforms}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
          transparent={true}
        />
      </mesh>

      {/* 3. Point light cast by the Sun */}
      <pointLight 
        position={[0, 0, 0]} 
        intensity={5.5} 
        distance={200} 
        decay={1.0} 
        color="#fffbeb" 
        castShadow
      />
    </group>
  );
}

export default Sun;
