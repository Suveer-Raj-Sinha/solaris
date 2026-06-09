import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../store/useStore';
import { textureGenerator } from '../utils/textureGenerator';

export function AsteroidBelt({ count = 1500, innerRadius = 26.0, outerRadius = 29.0 }) {
  const meshRef = useRef();
  const photoMode = useStore((state) => state.photoMode);

  // Generate memoized rocky texture (high contrast, realistic grey rock details)
  const asteroidTexture = useMemo(() => {
    return textureGenerator.createRocky('#9ca3af', '#4b5563', '#1f2937', 5);
  }, []);

  // Compute matrices for all asteroid instances
  const tempObject = useMemo(() => new THREE.Object3D(), []);
  
  const instanceData = useMemo(() => {
    const data = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = innerRadius + Math.random() * (outerRadius - innerRadius);
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = (Math.random() - 0.5) * 1.2; // Moderated thickness
      
      const scale = 0.07 + Math.random() * 0.13;
      // Irregular, non-uniform scaling to create organic rock shapes
      const scaleX = scale * (0.7 + Math.random() * 0.6);
      const scaleY = scale * (0.7 + Math.random() * 0.6);
      const scaleZ = scale * (0.7 + Math.random() * 0.6);
      
      const rotation = [
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      ];
      
      data.push({ x, y, z, scaleX, scaleY, scaleZ, rotation, speed: 0.1 + Math.random() * 0.2 });
    }
    return data;
  }, [count, innerRadius, outerRadius]);

  // Set initial transformation matrices
  useMemo(() => {
    // Wait for mount or component update
    setTimeout(() => {
      if (!meshRef.current) return;
      for (let i = 0; i < count; i++) {
        const item = instanceData[i];
        tempObject.position.set(item.x, item.y, item.z);
        tempObject.rotation.set(...item.rotation);
        tempObject.scale.set(item.scaleX, item.scaleY, item.scaleZ);
        tempObject.updateMatrix();
        meshRef.current.setMatrixAt(i, tempObject.matrix);
      }
      meshRef.current.instanceMatrix.needsUpdate = true;
    }, 50);
  }, [instanceData, count, tempObject]);

  // Animate the orbit of the entire asteroid belt
  useFrame((state) => {
    if (photoMode) return;
    const time = state.clock.getElapsedTime();
    if (meshRef.current) {
      // Rotate the entire belt group slowly around the Sun
      meshRef.current.rotation.y = time * 0.003;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]} castShadow receiveShadow>
      {/* Low-poly deformed sphere representing irregular rocky asteroids */}
      <dodecahedronGeometry args={[1, 1]} />
      <meshStandardMaterial 
        map={asteroidTexture} 
        roughness={0.9} 
        metalness={0.1}
      />
    </instancedMesh>
  );
}

export default AsteroidBelt;
