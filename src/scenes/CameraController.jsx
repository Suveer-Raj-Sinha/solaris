import React, { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useStore, getPlanetPosition } from '../store/useStore';
import gsap from 'gsap';
import * as THREE from 'three';

export function CameraController() {
  const { camera, scene } = useThree();
  const controlsRef = useRef();
  
  // Ref to track elapsed time for orbital position calculations during warp transitions
  const timeRef = useRef(0);

  const gamePhase = useStore((state) => state.gamePhase);
  const activePlanet = useStore((state) => state.activePlanet);
  const travelTarget = useStore((state) => state.travelTarget);
  const arriveAtDestination = useStore((state) => state.arriveAtDestination);
  const setGamePhase = useStore((state) => state.setGamePhase);
  const photoMode = useStore((state) => state.photoMode);
  const activeMoon = useStore((state) => state.activeMoon);
  const selectedPlanet = useStore((state) => state.selectedPlanet);
 
  // Capture clock time and update target/controls on each frame
  useFrame((state) => {
    timeRef.current = state.clock.getElapsedTime();
    
    if (controlsRef.current) {
      // Continuously lock target onto active moon or active planet in orbit mode for perfect centering
      if (gamePhase === 'orbit') {
        if (activeMoon) {
          const targetObj = scene.getObjectByName(activeMoon.id);
          if (targetObj) {
            const targetPos = new THREE.Vector3();
            targetObj.getWorldPosition(targetPos);
            controlsRef.current.target.lerp(targetPos, 0.08);
          }
        } else if (activePlanet) {
          const targetObj = scene.getObjectByName(activePlanet.id);
          if (targetObj) {
            const targetPos = new THREE.Vector3();
            targetObj.getWorldPosition(targetPos);
            controlsRef.current.target.lerp(targetPos, 0.08);
          }
        }
      }
      
      controlsRef.current.update();
    }

    // Direct DOM write for 60fps real-time HUD telemetry distance
    const telemetryEl = document.getElementById('hud-telemetry-distance');
    if (telemetryEl) {
      let activeObj = null;
      if (activeMoon) {
        activeObj = scene.getObjectByName(activeMoon.id);
      } else if (activePlanet) {
        activeObj = scene.getObjectByName(activePlanet.id);
      } else if (travelTarget) {
        activeObj = scene.getObjectByName(travelTarget.id);
      } else if (selectedPlanet) {
        activeObj = scene.getObjectByName(selectedPlanet.id);
      }
      
      if (activeObj) {
        const activePos = new THREE.Vector3();
        activeObj.getWorldPosition(activePos);
        const dist = camera.position.distanceTo(activePos);
        // Convert to pseudo-Astronomical Units (AU): 10 units = 1.0 AU
        const auDist = (dist * 0.1).toFixed(2);
        telemetryEl.innerText = `${auDist} AU`;
      } else {
        telemetryEl.innerText = '0.00 AU';
      }
    }
  });

  // Track phase modifications and trigger camera position tweens
  useEffect(() => {
    if (!controlsRef.current) return;
    
    // Kill any ongoing animations to prevent overlaps
    gsap.killTweensOf(camera.position);
    gsap.killTweensOf(controlsRef.current.target);

    if (gamePhase === 'landing') {
      // Position camera in cockpit seat
      camera.position.set(0, 1.2, 4.0);
      controlsRef.current.target.set(0, 1.2, -10);
      controlsRef.current.update();
    } 
    else if (gamePhase === 'launch') {
      // 1. Initial engine shake (simulate takeoff rumble)
      const shakeTimeline = gsap.timeline();
      for (let i = 0; i < 20; i++) {
        shakeTimeline.to(camera.position, {
          x: (Math.random() - 0.5) * 0.1,
          y: 1.2 + (Math.random() - 0.5) * 0.1,
          duration: 0.05
        });
      }
      
      // 2. Fly camera out of Earth atmosphere (exiting cockpit view)
      gsap.to(camera.position, {
        x: 0,
        y: 40,
        z: 75,
        duration: 3.5,
        delay: 1.0,
        ease: 'power2.inOut',
        onStart: () => {
          // Point camera target down towards the Sun
          gsap.to(controlsRef.current.target, {
            x: 0, y: 0, z: 0,
            duration: 3.5,
            ease: 'power2.inOut'
          });
        },
        onComplete: () => {
          setGamePhase('hub');
        }
      });

      // 3. Dynamic G-Force FOV stretch effect
      gsap.to(camera, {
        fov: 75,
        duration: 1.5,
        delay: 1.0,
        ease: 'power2.in',
        onUpdate: () => camera.updateProjectionMatrix()
      });
      gsap.to(camera, {
        fov: 55,
        duration: 2.0,
        delay: 2.5,
        ease: 'power2.out',
        onUpdate: () => camera.updateProjectionMatrix()
      });
    } 
    else if (gamePhase === 'hub') {
      // Orbit around the Sun
      gsap.to(camera.position, {
        x: 0,
        y: 35,
        z: 75,
        duration: 2.0,
        ease: 'power2.inOut',
        onUpdate: () => controlsRef.current.update()
      });
      gsap.to(controlsRef.current.target, {
        x: 0,
        y: 0,
        z: 0,
        duration: 2.0,
        ease: 'power2.inOut',
        onUpdate: () => controlsRef.current.update()
      });
    } 
    else if (gamePhase === 'orbit' && activePlanet) {
      // Find the active planet object and copy its world coordinates
      const targetObj = scene.getObjectByName(activePlanet.id);
      const targetPos = new THREE.Vector3();
      if (targetObj) {
        targetObj.getWorldPosition(targetPos);
      }
      
      // Lock target directly onto the planet's world coordinates
      controlsRef.current.target.copy(targetPos);
      controlsRef.current.update();
    }
  }, [gamePhase, activePlanet, camera, setGamePhase, scene]);

  // Handle travel cinematic warp timeline
  useEffect(() => {
    if (gamePhase === 'travel' && travelTarget && controlsRef.current) {
      gsap.killTweensOf(camera.position);
      gsap.killTweensOf(controlsRef.current.target);

      // Compute target position deterministically from the global orbitTime clock
      const orbitTime = useStore.getState().orbitTime || 0;
      const pos = getPlanetPosition(travelTarget.id, orbitTime);
      const targetPos = new THREE.Vector3(pos.x, pos.y, pos.z);

      // Create camera transition curve: pull back, warp to destination
      const startCamPos = camera.position.clone();
      const pullBackDir = startCamPos.clone().normalize().multiplyScalar(12);
      const pullBackPos = startCamPos.clone().add(pullBackDir); // Pull back camera for warp charge

      // Direction vector towards planet (static target)
      const approachOffset = new THREE.Vector3(0, travelTarget.size * 1.5, travelTarget.size * 3.5);
      const finalCamPos = targetPos.clone().add(approachOffset);

      const travelTl = gsap.timeline({
        onUpdate: () => {
          if (controlsRef.current) {
            controlsRef.current.update();
          }
        },
        onComplete: () => {
          arriveAtDestination();
        }
      });

      // Step 1: Face the target planet and charge warp (0.4s)
      travelTl.to(controlsRef.current.target, {
        x: targetPos.x,
        y: targetPos.y,
        z: targetPos.z,
        duration: 0.4,
        ease: 'power2.inOut'
      }, 0);

      travelTl.to(camera.position, {
        x: pullBackPos.x,
        y: pullBackPos.y,
        z: pullBackPos.z,
        duration: 0.4,
        ease: 'power2.inOut'
      }, 0);

      // Step 2: Warp speed acceleration and flyby (3.6s total flight duration)
      // Animate X and Z coordinates in world space (direct path)
      travelTl.to(camera.position, {
        x: finalCamPos.x,
        z: finalCamPos.z,
        duration: 3.6,
        ease: 'power3.inOut'
      }, 0.4);

      // Animate Y coordinate in an arch to clear the Sun at the origin [0,0,0]
      const midY = Math.max(startCamPos.y, finalCamPos.y) + 30.0; // Arch height
      
      travelTl.to(camera.position, {
        y: midY,
        duration: 1.8, // Rise to peak at midpoint of flight
        ease: 'power2.out'
      }, 0.4);

      travelTl.to(camera.position, {
        y: finalCamPos.y,
        duration: 1.8, // Descend back into destination orbit
        ease: 'power2.in'
      }, 2.2); // Starts exactly at 0.4s + 1.8s = 2.2s
    }
  }, [gamePhase, travelTarget, camera, arriveAtDestination, scene]);

  // Disable controls during travel / landing / countdown phases
  const controlsEnabled = (gamePhase === 'hub' || gamePhase === 'orbit') && !photoMode;

  const minZoom = gamePhase === 'orbit' ? (activeMoon ? activeMoon.size * 2.0 : activePlanet ? activePlanet.size * 1.6 : 3) : 3;
  const maxZoom = gamePhase === 'orbit' ? (activeMoon ? activeMoon.size * 10.0 : 35) : 180;

  return (
    <OrbitControls
      ref={controlsRef}
      enabled={controlsEnabled}
      enablePan={false} // Prevent user from panning target planet off-center
      enableDamping={true}
      dampingFactor={0.05}
      minDistance={minZoom}
      maxDistance={maxZoom}
      makeDefault
    />
  );
}

export default CameraController;
