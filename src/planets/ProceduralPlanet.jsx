import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { useStore, getPlanetPosition } from '../store/useStore';
import { textureGenerator } from '../utils/textureGenerator';
import moonsData from '../../data/moons.json';
import spaceSoundSynth from '../utils/soundSynth';
import { Info, HelpCircle } from 'lucide-react';

// Custom GLSL shader for atmospheric rim scattering glow (facing the Sun)
const AtmosphereShaderMaterial = {
  uniforms: {
    uAtmosphereColor: { value: new THREE.Color('#3b82f6') },
    uAtmospherePower: { value: 4.0 },
    uAtmosphereIntensity: { value: 0.8 }
  },
  vertexShader: `
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    varying vec3 vViewPosition;

    void main() {
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -mvPosition.xyz;
      vNormal = normalize(normalMatrix * normal);
      
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    uniform vec3 uAtmosphereColor;
    uniform float uAtmospherePower;
    uniform float uAtmosphereIntensity;
    
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    varying vec3 vViewPosition;

    void main() {
      vec3 normal = normalize(vNormal);
      vec3 viewDir = normalize(vViewPosition);
      
      // 1. Fresnel rim intensity (glow increases at grazing angles)
      float rimIntensity = pow(1.0 - dot(normal, viewDir), uAtmospherePower) * uAtmosphereIntensity;
      
      // 2. Light direction vector pointing from the planet towards the Sun at [0,0,0]
      vec3 lightDir = normalize(-vWorldPosition);
      
      // 3. Diffuse lighting hemisphere multiplier (glow only on sunlit side facing the origin)
      float sunFacing = max(0.0, dot(normal, lightDir) * 1.5 + 0.1);
      
      gl_FragColor = vec4(uAtmosphereColor, rimIntensity * sunFacing);
    }
  `
};

// Custom GLSL shader for planet rings (Saturn/Uranus) with self-shadowing
const RingShaderMaterial = {
  uniforms: {
    uRingsTexture: { value: null },
    uOpacity: { value: 0.35 },
    uPlanetCenter: { value: new THREE.Vector3() },
    uPlanetRadius: { value: 1.0 },
    uInnerRadius: { value: 1.0 },
    uOuterRadius: { value: 2.0 }
  },
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vWorldPosition;
    varying vec3 vLocalPosition;
    varying vec3 vNormal;

    void main() {
      vUv = uv;
      vLocalPosition = position;
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D uRingsTexture;
    uniform float uOpacity;
    uniform vec3 uPlanetCenter;
    uniform float uPlanetRadius;
    uniform float uInnerRadius;
    uniform float uOuterRadius;

    varying vec2 vUv;
    varying vec3 vWorldPosition;
    varying vec3 vLocalPosition;
    varying vec3 vNormal;

    void main() {
      // 1. Map radial bands using concentric distances from local origin
      float dist = length(vLocalPosition.xy);
      float radialCoord = (dist - uInnerRadius) / (uOuterRadius - uInnerRadius);
      radialCoord = clamp(radialCoord, 0.0, 1.0);

      // Sample ring texture
      vec4 texColor = texture2D(uRingsTexture, vec2(radialCoord, 0.5));
      if (texColor.a < 0.01) {
        discard;
      }

      // 2. Light ray direction from Sun [0,0,0] to fragment
      vec3 rayDir = normalize(vWorldPosition);

      // 3. Shadow intersection logic
      float shadowFactor = 1.0;
      float dStep = dot(rayDir, uPlanetCenter);

      if (dStep > 0.0) { // Planet is in direction of light ray
        float dPerpSq = dot(uPlanetCenter, uPlanetCenter) - dStep * dStep;
        float dPerp = sqrt(max(0.0, dPerpSq));

        // Check if sphere is between Sun and fragment
        if (dStep < length(vWorldPosition)) {
          float edgeWidth = 0.04 * uPlanetRadius;
          float inShadow = smoothstep(uPlanetRadius - edgeWidth, uPlanetRadius, dPerp);
          shadowFactor = mix(0.12, 1.0, inShadow); // 12% shadow ambient light floor
        }
      }

      // 4. Basic diffuse lighting (double sided)
      vec3 lightDir = normalize(-vWorldPosition);
      float diffuse = abs(dot(vNormal, lightDir));
      float lightIntensity = mix(0.4, 1.0, diffuse);

      gl_FragColor = vec4(texColor.rgb * shadowFactor * lightIntensity, texColor.a * uOpacity);
    }
  `
};

// Clickable Moon Component
function MoonComponent({ moon }) {
  const moonRef = useRef();
  const photoMode = useStore((state) => state.photoMode);
  const gamePhase = useStore((state) => state.gamePhase);
  const selectMoon = useStore((state) => state.selectMoon);
  const audioEnabled = useStore((state) => state.audioEnabled);

  // Memoize unique moon rocky texture based on its database color
  const moonTexture = useMemo(() => {
    const baseColor = new THREE.Color(moon.color || '#6b7280');
    const color1 = '#' + baseColor.getHexString();
    const color2 = '#' + baseColor.clone().multiplyScalar(0.65).getHexString();
    const color3 = '#' + baseColor.clone().multiplyScalar(0.35).getHexString();
    
    const craters = Math.max(4, Math.floor(moon.size * 45));
    const fallback = textureGenerator.createRocky(color1, color2, color3, craters);
    
    // Fall back to unique procedural texture if no custom high-res URL exists (e.g. Earth's moon uses 'moon')
    return textureGenerator.loadHighRes(moon.id, fallback);
  }, [moon]);

  useFrame((state, delta) => {
    if (photoMode || gamePhase === 'travel') return;
    const time = state.clock.getElapsedTime();
    
    // Moon orbit rotation
    const angle = time * moon.orbitSpeed;
    const x = Math.cos(angle) * moon.orbitRadius;
    const z = Math.sin(angle) * moon.orbitRadius;
    
    if (moonRef.current) {
      moonRef.current.position.set(x, 0, z);
      moonRef.current.rotation.y += 0.01;
    }
  });

  const handleMoonClick = (e) => {
    e.stopPropagation();
    if (gamePhase !== 'orbit') return;
    if (audioEnabled) spaceSoundSynth.playClick();
    selectMoon(moon);
  };

  return (
    <mesh 
      ref={moonRef} 
      name={moon.id} 
      onClick={handleMoonClick}
      castShadow 
      receiveShadow
      className="cursor-pointer"
    >
      <sphereGeometry args={[moon.size, 16, 16]} />
      <meshStandardMaterial 
        map={moonTexture} 
        roughness={0.9}
        metalness={0.1}
      />
    </mesh>
  );
}

// Main Planet Component
export function ProceduralPlanet({ planet }) {
  const groupRef = useRef();
  const planetRef = useRef();
  const cloudsRef = useRef();
  
  const gamePhase = useStore((state) => state.gamePhase);
  const activePlanet = useStore((state) => state.activePlanet);
  const selectPlanet = useStore((state) => state.selectPlanet);
  const selectedPlanet = useStore((state) => state.selectedPlanet);
  const photoMode = useStore((state) => state.photoMode);
  const audioEnabled = useStore((state) => state.audioEnabled);
  const startTravel = useStore((state) => state.startTravel);
  const unlockedDiscoveries = useStore((state) => state.unlockedDiscoveries);
  const unlockDiscovery = useStore((state) => state.unlockDiscovery);
  
  // Dynamic Physics & Moon state hooks
  const showLabels = useStore((state) => state.showLabels);
  const selectMoon = useStore((state) => state.selectMoon);
  const activeMoon = useStore((state) => state.activeMoon);

  // Geiger sonar beep rate tracking
  const lastChirpTimeRef = useRef(0);
  const ringMaterialRef = useRef();

  const isCurrentActive = activePlanet?.id === planet.id;
  const isSelected = selectedPlanet?.id === planet.id;

  // Atmosphere glow setup
  const hasAtmosphere = planet.id === 'earth' || planet.id === 'venus' || planet.id === 'neptune';
  const atmosphereUniforms = useMemo(() => {
    let color = '#3b82f6';
    let power = 4.2;
    let intensity = 0.75;

    if (planet.id === 'earth') {
      color = '#60a5fa'; // Pale blue
      power = 4.2;
      intensity = 0.8;
    } else if (planet.id === 'venus') {
      color = '#f59e0b'; // Thick amber
      power = 3.2;
      intensity = 0.85;
    } else if (planet.id === 'neptune') {
      color = '#00b4d8'; // Deep blue/cyan
      power = 3.8;
      intensity = 0.9;
    }
    return {
      uAtmosphereColor: { value: new THREE.Color(color) },
      uAtmospherePower: { value: power },
      uAtmosphereIntensity: { value: intensity }
    };
  }, [planet.id]);

  // Filter moons for this planet
  const moons = useMemo(() => {
    return moonsData.filter(m => m.planetId === planet.id);
  }, [planet.id]);

  // Load textures from global cache (procedural maps are generated once)
  const planetTexture = useMemo(() => {
    return textureGenerator.getPlanetTexture(planet.id);
  }, [planet.id]);

  // Clouds texture for Earth/Venus
  const cloudsTexture = useMemo(() => {
    return textureGenerator.getCloudsTexture(planet.id);
  }, [planet.id]);

  // Rings texture
  const ringsTexture = useMemo(() => {
    if (!planet.hasRings) return null;
    return textureGenerator.getRingsTexture(planet.id, planet.ringColor);
  }, [planet.hasRings, planet.ringColor, planet.id]);

  // Animate self-rotation, cloud motion, and orbits
  useFrame((state, delta) => {
    // 1. Self Rotation (paused in photoMode)
    if (!photoMode) {
      if (planetRef.current) {
        planetRef.current.rotation.y += planet.rotationSpeed;
      }
      if (cloudsRef.current) {
        cloudsRef.current.rotation.y += planet.rotationSpeed * 1.25;
      }
    }

    // 3. Orbital position around the Sun
    if (gamePhase === 'hub' || gamePhase === 'travel' || gamePhase === 'orbit') {
      const orbitTime = useStore.getState().orbitTime || 0;
      const pos = getPlanetPosition(planet.id, orbitTime);
      if (groupRef.current) {
        groupRef.current.position.set(pos.x, pos.y, pos.z);
      }
    }

    // 4. Audio-guided Geiger Anomaly Scanner (Orbit Focus Mode)
    if (gamePhase === 'orbit' && isCurrentActive && planet.hotspots && !photoMode) {
      const time = state.clock.getElapsedTime();
      
      const camPos = state.camera.position.clone();
      const planetWorldPos = new THREE.Vector3();
      groupRef.current.getWorldPosition(planetWorldPos);
      
      // Direction vector from planet center to camera
      const camDir = camPos.sub(planetWorldPos).normalize();
      
      let maxAlignment = 0;
      planet.hotspots.forEach((hotspot) => {
        const unlocked = unlockedDiscoveries.includes(hotspot.discoveryId);
        if (!unlocked) {
          const hotspotDir = new THREE.Vector3(...hotspot.position).normalize();
          const dot = camDir.dot(hotspotDir);
          if (dot > maxAlignment) {
            maxAlignment = dot;
          }
        }
      });
      
      // Proximity beep trigger
      if (maxAlignment > 0.6) {
        const factor = (maxAlignment - 0.6) / 0.4; // 0 to 1
        const interval = 1.0 - factor * 0.88; // 1.0s down to 0.12s
        
        if (time - lastChirpTimeRef.current >= interval) {
          lastChirpTimeRef.current = time;
          if (audioEnabled) {
            spaceSoundSynth.playScannerPing(factor);
          }
        }
      }
    }

    // 5. Update planet center uniform for custom self-shadowed ring shader
    if (ringMaterialRef.current && groupRef.current) {
      const planetWorldPos = new THREE.Vector3();
      groupRef.current.getWorldPosition(planetWorldPos);
      ringMaterialRef.current.uniforms.uPlanetCenter.value.copy(planetWorldPos);
    }
  });

  const handlePlanetClick = (e) => {
    e.stopPropagation();
    if (gamePhase !== 'hub') return;
    
    if (audioEnabled) spaceSoundSynth.playClick();
    selectPlanet(planet.id);
  };

  const handlePlanetPointerOver = () => {
    if (gamePhase === 'hub' && audioEnabled) {
      spaceSoundSynth.playHover();
    }
  };

  return (
    <group ref={groupRef} name={planet.id}>
      {/* Local exhibition lighting forFocused Planet display */}
      {gamePhase === 'orbit' && isCurrentActive && (
        <group>
          <directionalLight position={[6, 4, 8]} intensity={2.0} />
          <ambientLight intensity={0.26} />
        </group>
      )}
      {/* Rotation group matching the axial tilt */}
      <group rotation={[0, 0, planet.id === 'uranus' ? Math.PI / 2 : 0.08]}>
        
        {/* Planet Core Sphere */}
        <mesh 
          ref={planetRef}
          onClick={handlePlanetClick}
          onPointerOver={handlePlanetPointerOver}
          castShadow 
          receiveShadow
        >
          <sphereGeometry args={[planet.size, 32, 32]} />
          <meshStandardMaterial 
            map={planetTexture}
            roughness={planet.id === 'earth' ? 0.4 : 0.95}
            metalness={planet.id === 'earth' ? 0.1 : 0.05}
          />
        </mesh>

        {/* Clouds overlay */}
        {cloudsTexture && (
          <mesh ref={cloudsRef}>
            <sphereGeometry args={[planet.size * 1.015, 32, 32]} />
            <meshStandardMaterial 
              map={cloudsTexture} 
              transparent={true} 
              depthWrite={false}
            />
          </mesh>
        )}

        {/* Atmospheric scattering glow (only for Earth and Venus) */}
        {hasAtmosphere && (
          <mesh>
            <sphereGeometry args={[planet.size * 1.03, 32, 32]} />
            <shaderMaterial
              vertexShader={AtmosphereShaderMaterial.vertexShader}
              fragmentShader={AtmosphereShaderMaterial.fragmentShader}
              uniforms={atmosphereUniforms}
              blending={THREE.AdditiveBlending}
              side={THREE.BackSide}
              transparent={true}
            />
          </mesh>
        )}

        {/* Rings */}
        {planet.hasRings && ringsTexture && (
          <mesh rotation={[Math.PI / 2.2, 0, 0]} castShadow receiveShadow>
            <ringGeometry args={[planet.ringInnerRadius, planet.ringOuterRadius, 64]} />
            <shaderMaterial
              ref={ringMaterialRef}
              vertexShader={RingShaderMaterial.vertexShader}
              fragmentShader={RingShaderMaterial.fragmentShader}
              uniforms={useMemo(() => ({
                uRingsTexture: { value: ringsTexture },
                uOpacity: { value: 0.35 },
                uPlanetCenter: { value: new THREE.Vector3() },
                uPlanetRadius: { value: planet.size },
                uInnerRadius: { value: planet.ringInnerRadius },
                uOuterRadius: { value: planet.ringOuterRadius }
              }), [ringsTexture, planet.size, planet.ringInnerRadius, planet.ringOuterRadius])}
              transparent={true}
              side={THREE.DoubleSide}
            />
          </mesh>
        )}
      </group>

      {/* Moons */}
      {moons.map(moon => (
        <MoonComponent key={moon.id} moon={moon} />
      ))}


      {/* Selected Indicator Ring */}
      {gamePhase === 'hub' && isSelected && (
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, planet.size * 1.2, 0]}>
          <ringGeometry args={[planet.size * 1.3, planet.size * 1.4, 32]} />
          <meshBasicMaterial color="#06b6d4" opacity={0.6} transparent={true} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Interactive Surface Hotspots (Only visible in Orbit Mode) */}
      {gamePhase === 'orbit' && isCurrentActive && planet.hotspots && !photoMode && (
        planet.hotspots.map((hotspot) => {
          // Project normalized coordinates onto the sphere surface
          const pos = new THREE.Vector3(...hotspot.position).normalize().multiplyScalar(planet.size * 1.08);
          const unlocked = unlockedDiscoveries.includes(hotspot.discoveryId);

          return (
            <group key={hotspot.id} position={pos}>
              {/* Floating interactive HTML Node */}
              <Html distanceFactor={8} center>
                <div className="relative group/hotspot pointer-events-auto">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (audioEnabled) spaceSoundSynth.playClick();
                      const newlyUnlocked = unlockDiscovery(hotspot.discoveryId);
                      if (newlyUnlocked) {
                        // Action triggers visual update
                      }
                    }}
                    className={`flex items-center justify-center w-6 h-6 rounded-full border shadow-lg transition-all transform hover:scale-125 ${
                      unlocked
                        ? 'bg-cyan-600/60 border-cyan-400 text-white'
                        : 'bg-orange-600/70 border-orange-400 text-white animate-pulse'
                    }`}
                  >
                    {unlocked ? <Info className="w-3.5 h-3.5" /> : <HelpCircle className="w-3.5 h-3.5" />}
                  </button>

                  {/* Hotspot details card */}
                  <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-48 p-3 bg-slate-950/90 border border-cyan-500/30 rounded-lg text-slate-100 text-left opacity-0 pointer-events-none group-hover/hotspot:opacity-100 transition-opacity duration-200 backdrop-blur-sm z-50">
                    <div className="flex justify-between items-center border-b border-cyan-500/20 pb-1 mb-1">
                      <span className="text-[10px] font-bold tracking-wide text-white">{hotspot.name}</span>
                      <span className="text-[7px] font-mono text-cyan-400 uppercase">
                        {unlocked ? 'Decrypted' : 'Anomalous'}
                      </span>
                    </div>
                    <p className="text-[9px] font-mono text-slate-300 leading-tight">{hotspot.description}</p>
                    {!unlocked && (
                      <p className="text-[8px] font-mono text-orange-400 mt-1 animate-pulse">
                        &gt; Click to decrypt log
                      </p>
                    )}
                  </div>
                </div>
              </Html>
            </group>
          );
        })
      )}
      {/* Floating 2D Planet Name Tag (only visible in HUB view and when toggled on) */}
      {gamePhase === 'hub' && showLabels && (
        <Html distanceFactor={22} center position={[0, planet.size * 1.6, 0]}>
          <div className="font-mono text-[9px] text-cyan-400 bg-slate-950/80 px-2 py-0.5 border border-cyan-500/20 rounded shadow-md pointer-events-none select-none whitespace-nowrap uppercase tracking-widest text-glow">
            {planet.name}
          </div>
        </Html>
      )}
    </group>
  );
}

export default ProceduralPlanet;
