import React, { useRef, useEffect } from 'react';
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from '@react-three/postprocessing';
import { useStore } from '../store/useStore';
import gsap from 'gsap';

// Safe setter for ChromaticAberration offset since it can be array, Vector2, or custom object depending on version
const setOffset = (effect, x, y) => {
  if (!effect || !effect.offset) return;
  const offset = effect.offset;
  if (typeof offset.set === 'function') {
    offset.set(x, y);
  } else if (Array.isArray(offset)) {
    offset[0] = x;
    offset[1] = y;
  } else {
    offset.x = x;
    offset.y = y;
  }
};

// Safe getter for ChromaticAberration offset
const getOffset = (effect) => {
  if (!effect || !effect.offset) return { x: 0, y: 0 };
  const offset = effect.offset;
  if (Array.isArray(offset)) {
    return { x: offset[0] || 0, y: offset[1] || 0 };
  }
  return { x: offset.x || 0, y: offset.y || 0 };
};

export function PostEffects() {
  const gamePhase = useStore((state) => state.gamePhase);
  const bloomRef = useRef();
  const caRef = useRef();
  const vignetteRef = useRef();

  useEffect(() => {
    // Kill any active tweens to prevent overlapping animations
    if (bloomRef.current) gsap.killTweensOf(bloomRef.current);
    if (caRef.current) gsap.killTweensOf(caRef.current);
    if (vignetteRef.current) gsap.killTweensOf(vignetteRef.current);

    if (gamePhase === 'travel') {
      // Warp sequence timeline (4.0s total duration, matching CameraController transition)
      const tl = gsap.timeline();

      // 1. Charging Phase (0.0s to 0.4s)
      // Smoothly darken vignette and elevate bloom intensity
      tl.to(bloomRef.current, {
        intensity: 1.5,
        duration: 0.4,
        ease: 'power1.in'
      }, 0);

      tl.to(vignetteRef.current, {
        darkness: 0.8,
        duration: 0.4,
        ease: 'power1.in'
      }, 0);

      // 2. Jump to Warp Speed Spike (at 0.4s)
      // Visual feedback peak: spike Chromatic Aberration, Bloom, and Vignette
      tl.to(bloomRef.current, {
        intensity: 6.0,
        duration: 0.35,
        ease: 'expo.out'
      }, 0.4);

      const offsetObj = { x: 0, y: 0 };
      tl.to(offsetObj, {
        x: 0.09,
        y: 0.09,
        duration: 0.35,
        ease: 'expo.out',
        onUpdate: () => {
          setOffset(caRef.current, offsetObj.x, offsetObj.y);
        }
      }, 0.4);

      tl.to(vignetteRef.current, {
        darkness: 1.4,
        duration: 0.35,
        ease: 'expo.out'
      }, 0.4);

      // 3. Steady Cruise Phase (0.75s to 3.0s)
      // Decay spike to cruise blur level
      tl.to(bloomRef.current, {
        intensity: 2.2,
        duration: 0.6,
        ease: 'power2.out'
      }, 0.75);

      tl.to(offsetObj, {
        x: 0.012,
        y: 0.012,
        duration: 0.6,
        ease: 'power2.out',
        onUpdate: () => {
          setOffset(caRef.current, offsetObj.x, offsetObj.y);
        }
      }, 0.75);

      tl.to(vignetteRef.current, {
        darkness: 0.9,
        duration: 0.6,
        ease: 'power2.out'
      }, 0.75);

      // Continuous warp speed cruise vibration (jittery space-time noise)
      const vibrationObj = { val: 0 };
      tl.to(vibrationObj, {
        val: 1.0,
        duration: 2.25, // covers remaining cruise time (up to 3.0s)
        onUpdate: () => {
          const jitterX = 0.012 + (Math.random() - 0.5) * 0.004;
          const jitterY = 0.012 + (Math.random() - 0.5) * 0.004;
          setOffset(caRef.current, jitterX, jitterY);
        }
      }, 1.35);

      // 4. Deceleration & Orbit Entry (3.0s to 4.0s)
      // Ease all post-processing distortion back to planetary exploration baseline
      tl.to(bloomRef.current, {
        intensity: 0.6,
        duration: 1.0,
        ease: 'power2.out'
      }, 3.0);

      tl.to(offsetObj, {
        x: 0.0,
        y: 0.0,
        duration: 1.0,
        ease: 'power2.out',
        onUpdate: () => {
          setOffset(caRef.current, 0.0, 0.0);
        }
      }, 3.0);

      tl.to(vignetteRef.current, {
        darkness: 0.5,
        duration: 1.0,
        ease: 'power2.out'
      }, 3.0);

    } else {
      // Return to baseline values outside of travel phase
      if (bloomRef.current) {
        gsap.to(bloomRef.current, { intensity: 0.6, duration: 1.0 });
      }
      if (caRef.current) {
        const currentOffset = getOffset(caRef.current);
        const offsetObj = { 
          x: currentOffset.x, 
          y: currentOffset.y 
        };
        gsap.to(offsetObj, {
          x: 0.0,
          y: 0.0,
          duration: 1.0,
          onUpdate: () => {
            setOffset(caRef.current, offsetObj.x, offsetObj.y);
          }
        });
      }
      if (vignetteRef.current) {
        gsap.to(vignetteRef.current, { darkness: 0.5, duration: 1.0 });
      }
    }
  }, [gamePhase]);

  return (
    <EffectComposer>
      <Bloom 
        ref={(node) => { bloomRef.current = node; }} 
        intensity={0.6} 
        luminanceThreshold={0.15} 
        mipmapBlur={true} 
      />
      <ChromaticAberration 
        ref={(node) => { caRef.current = node; }} 
        offset={[0.0, 0.0]} 
        radialModulation={false} 
      />
      <Vignette 
        ref={(node) => { vignetteRef.current = node; }} 
        darkness={0.5} 
        offset={0.5} 
      />
    </EffectComposer>
  );
}

export default PostEffects;
