import * as THREE from 'three';

// 3D Value Noise for seamless spherical mapping
const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
const lerp = (t, a, b) => a + t * (b - a);

const HASH_TABLE = new Float32Array(512);
for (let i = 0; i < 512; i++) {
  HASH_TABLE[i] = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  HASH_TABLE[i] = HASH_TABLE[i] - Math.floor(HASH_TABLE[i]);
}

const noise3D = (x, y, z) => {
  const X = Math.floor(x) & 255;
  const Y = Math.floor(y) & 255;
  const Z = Math.floor(z) & 255;

  const xf = x - Math.floor(x);
  const yf = y - Math.floor(y);
  const zf = z - Math.floor(z);

  const u = fade(xf);
  const v = fade(yf);
  const w = fade(zf);

  const hash = (i, j, k) => HASH_TABLE[(i + HASH_TABLE[(j + HASH_TABLE[k & 255] * 255) & 255] * 255) & 511];

  const c000 = hash(X, Y, Z);
  const c100 = hash(X + 1, Y, Z);
  const c010 = hash(X, Y + 1, Z);
  const c110 = hash(X + 1, Y + 1, Z);
  const c001 = hash(X, Y, Z + 1);
  const c101 = hash(X + 1, Y, Z + 1);
  const c011 = hash(X, Y + 1, Z + 1);
  const c111 = hash(X + 1, Y + 1, Z + 1);

  const r00 = lerp(u, c000, c100);
  const r10 = lerp(u, c010, c110);
  const r01 = lerp(u, c001, c101);
  const r11 = lerp(u, c011, c111);

  const r0 = lerp(v, r00, r10);
  const r1 = lerp(v, r01, r11);

  return lerp(w, r0, r1);
};

const fbm3D = (x, y, z, octaves = 4) => {
  let value = 0;
  let amplitude = 1.0;
  let frequency = 1.0;
  let max = 0;
  for (let i = 0; i < octaves; i++) {
    value += amplitude * noise3D(x * frequency, y * frequency, z * frequency);
    max += amplitude;
    amplitude *= 0.5;
    frequency *= 2.0;
  }
  return value / max;
};

const uvToCartesian = (u, v) => {
  const theta = u * Math.PI * 2;
  const phi = v * Math.PI;
  return {
    x: Math.sin(phi) * Math.cos(theta),
    y: Math.cos(phi),
    z: Math.sin(phi) * Math.sin(theta)
  };
};

// High-resolution planet maps hosted on jsDelivr CDN (CORS compliant)
export const TEXTURE_URLS = {
  sun: 'https://cdn.jsdelivr.net/gh/jeromeetienne/threex.planets@master/images/sunmap.jpg',
  mercury: 'https://cdn.jsdelivr.net/gh/jeromeetienne/threex.planets@master/images/mercurymap.jpg',
  venus: 'https://cdn.jsdelivr.net/gh/jeromeetienne/threex.planets@master/images/venusmap.jpg',
  earth: 'https://cdn.jsdelivr.net/gh/jeromeetienne/threex.planets@master/images/earthmap1k.jpg',
  earthClouds: 'https://cdn.jsdelivr.net/gh/jeromeetienne/threex.planets@master/images/earthcloudmap.jpg',
  moon: 'https://cdn.jsdelivr.net/gh/jeromeetienne/threex.planets@master/images/moonmap1k.jpg',
  mars: 'https://cdn.jsdelivr.net/gh/jeromeetienne/threex.planets@master/images/marsmap1k.jpg',
  jupiter: 'https://cdn.jsdelivr.net/gh/jeromeetienne/threex.planets@master/images/jupitermap.jpg',
  saturn: 'https://cdn.jsdelivr.net/gh/jeromeetienne/threex.planets@master/images/saturnmap.jpg',
  saturnRings: 'https://cdn.jsdelivr.net/gh/jeromeetienne/threex.planets@master/images/saturnringcolor.jpg',
  uranus: 'https://cdn.jsdelivr.net/gh/jeromeetienne/threex.planets@master/images/uranusmap.jpg',
  neptune: 'https://cdn.jsdelivr.net/gh/jeromeetienne/threex.planets@master/images/neptunemap.jpg',
  pluto: 'https://cdn.jsdelivr.net/gh/jeromeetienne/threex.planets@master/images/plutomap1k.jpg'
};

const textureLoader = new THREE.TextureLoader();

const textureCache = {};

export const textureGenerator = {
  // Load high-res texture with fallback
  loadHighRes: (key, fallbackTexture) => {
    const url = TEXTURE_URLS[key];
    if (!url) return fallbackTexture;

    // Load texture asynchronously. Threejs updates it in the GPU as soon as it completes downloading
    const tex = textureLoader.load(url, (t) => {
      t.wrapS = THREE.RepeatWrapping;
      t.wrapT = THREE.ClampToEdgeWrapping;
      t.colorSpace = THREE.SRGBColorSpace;
    }, undefined, (e) => {
      console.warn(`Failed loading texture for ${key}: fallback procedural active.`);
    });
    return tex;
  },

  getPlanetTexture: (planetId) => {
    if (textureCache[planetId]) {
      return textureCache[planetId];
    }

    let texture;
    switch (planetId) {
      case 'sun': {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        grad.addColorStop(0, '#f59e0b');
        grad.addColorStop(0.5, '#ea580c');
        grad.addColorStop(1, '#b91c1c');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const fallback = new THREE.CanvasTexture(canvas);
        fallback.wrapS = THREE.RepeatWrapping;
        fallback.wrapT = THREE.ClampToEdgeWrapping;
        texture = textureGenerator.loadHighRes('sun', fallback);
        break;
      }
      case 'mercury':
        texture = textureGenerator.loadHighRes('mercury', textureGenerator.createRocky('#4b5563', '#374151', '#1f2937', 22));
        break;
      case 'venus':
        texture = textureGenerator.loadHighRes('venus', textureGenerator.createRocky('#b45309', '#d97706', '#78350f', 0));
        break;
      case 'earth':
        texture = textureGenerator.loadHighRes('earth', textureGenerator.createRocky('#1d4ed8', '#10b981', '#047857', 0));
        break;
      case 'mars':
        texture = textureGenerator.loadHighRes('mars', textureGenerator.createRocky('#991b1b', '#b91c1c', '#7f1d1d', 16));
        break;
      case 'jupiter':
        texture = textureGenerator.loadHighRes('jupiter', textureGenerator.createGasGiant(['#f97316', '#ea580c', '#c2410c', '#ca8a04', '#854d0e', '#78350f']));
        break;
      case 'saturn':
        texture = textureGenerator.loadHighRes('saturn', textureGenerator.createGasGiant(['#eab308', '#ca8a04', '#a16207', '#854d0e', '#713f12']));
        break;
      case 'uranus':
        texture = textureGenerator.loadHighRes('uranus', textureGenerator.createGasGiant(['#06b6d4', '#0891b2', '#0e7490', '#155e75']));
        break;
      case 'neptune':
        texture = textureGenerator.loadHighRes('neptune', textureGenerator.createGasGiant(['#1d4ed8', '#1e40af', '#1e3a8a', '#172554']));
        break;
      case 'pluto':
        texture = textureGenerator.loadHighRes('pluto', textureGenerator.createRocky('#7c3aed', '#a78bfa', '#4c1d95', 8));
        break;
      default:
        texture = textureGenerator.loadHighRes(planetId, textureGenerator.createRocky('#6b7280', '#4b5563', '#374151', 10));
    }

    textureCache[planetId] = texture;
    return texture;
  },

  getCloudsTexture: (planetId) => {
    const key = `${planetId}Clouds`;
    if (textureCache[key]) {
      return textureCache[key];
    }

    let texture = null;
    if (planetId === 'earth') {
      const fallback = textureGenerator.createClouds('#ffffff');
      texture = textureGenerator.loadHighRes('earthClouds', fallback);
    } else if (planetId === 'venus') {
      texture = textureGenerator.createClouds('#f59e0b');
    }

    if (texture) {
      textureCache[key] = texture;
    }
    return texture;
  },

  getRingsTexture: (planetId, ringColor) => {
    const key = `${planetId}Rings`;
    if (textureCache[key]) {
      return textureCache[key];
    }

    const fallback = textureGenerator.createRings(ringColor);
    let texture = fallback;
    if (planetId === 'saturn') {
      texture = textureGenerator.loadHighRes('saturnRings', fallback);
    }

    textureCache[key] = texture;
    return texture;
  },

  createRocky: (color1, color2, color3, craterCount = 15) => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    const c1 = new THREE.Color(color1);
    const c2 = new THREE.Color(color2);
    const c3 = new THREE.Color(color3);

    const imgData = ctx.createImageData(canvas.width, canvas.height);
    for (let y = 0; y < canvas.height; y++) {
      const v = y / canvas.height;
      for (let x = 0; x < canvas.width; x++) {
        const u = x / canvas.width;
        
        const p = uvToCartesian(u, v);
        const n = fbm3D(p.x * 5, p.y * 5, p.z * 5, 5);
        
        let col = new THREE.Color();
        if (n < 0.55) {
          col.lerpColors(c1, c2, n / 0.55);
        } else {
          col.lerpColors(c2, c3, (n - 0.55) / 0.45);
        }

        const idx = (y * canvas.width + x) * 4;
        imgData.data[idx] = Math.floor(col.r * 255);
        imgData.data[idx + 1] = Math.floor(col.g * 255);
        imgData.data[idx + 2] = Math.floor(col.b * 255);
        imgData.data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);

    for (let i = 0; i < craterCount; i++) {
      const cx = Math.random() * canvas.width;
      const cy = Math.random() * (canvas.height - 40) + 20;
      const size = Math.random() * 12 + 3;

      ctx.beginPath();
      ctx.arc(cx, cy, size, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0,0,0,0.45)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx + 1, cy + 1, size, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1.0;
      ctx.stroke();

      const gradient = ctx.createRadialGradient(cx - size * 0.1, cy - size * 0.1, size * 0.1, cx, cy, size);
      gradient.addColorStop(0, 'rgba(0,0,0,0.3)');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(cx, cy, size, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  },

  createGasGiant: (colorsList) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const colors = colorsList.map(c => new THREE.Color(c));
    const imgData = ctx.createImageData(canvas.width, canvas.height);

    for (let y = 0; y < canvas.height; y++) {
      const v = y / canvas.height;
      for (let x = 0; x < canvas.width; x++) {
        const u = x / canvas.width;

        const p = uvToCartesian(u, v);
        const swirl = fbm3D(p.x * 3, p.y * 3, p.z * 3 + 1.2, 4);
        const yCoord = v + swirl * 0.12 * Math.sin(p.x * Math.PI * 4);

        const bandIndex = Math.min(
          colors.length - 1,
          Math.max(0, Math.floor(yCoord * colors.length))
        );
        const nextBandIndex = Math.min(colors.length - 1, bandIndex + 1);
        const bandFrac = (yCoord * colors.length) % 1;

        const col = new THREE.Color();
        col.lerpColors(colors[bandIndex], colors[nextBandIndex], bandFrac);

        const detail = noise3D(p.x * 20, p.y * 40, p.z * 20) * 0.08;
        col.multiplyScalar(1.0 - detail);

        if (colorsList.includes('#f97316')) {
          const spotX = 0.65;
          const spotY = 0.68;
          const dist = Math.sqrt(
            Math.pow((u - spotX) * 2.0, 2) + Math.pow(v - spotY, 2)
          );
          if (dist < 0.05) {
            const spotCol = new THREE.Color('#991b1b');
            const blend = (1.0 - dist / 0.05);
            col.lerp(spotCol, blend * 0.95);
          }
        }

        const idx = (y * canvas.width + x) * 4;
        imgData.data[idx] = Math.floor(col.r * 255);
        imgData.data[idx + 1] = Math.floor(col.g * 255);
        imgData.data[idx + 2] = Math.floor(col.b * 255);
        imgData.data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  },

  createClouds: (baseColor = '#ffffff') => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    const col = new THREE.Color(baseColor);
    const imgData = ctx.createImageData(canvas.width, canvas.height);

    for (let y = 0; y < canvas.height; y++) {
      const v = y / canvas.height;
      for (let x = 0; x < canvas.width; x++) {
        const u = x / canvas.width;

        const p = uvToCartesian(u, v);
        const n = fbm3D(p.x * 6 + 2.0, p.y * 6 + 1.0, p.z * 6, 5);
        const alpha = Math.max(0, (n - 0.46) / 0.54);

        const idx = (y * canvas.width + x) * 4;
        imgData.data[idx] = Math.floor(col.r * 255);
        imgData.data[idx + 1] = Math.floor(col.g * 255);
        imgData.data[idx + 2] = Math.floor(col.b * 255);
        imgData.data[idx + 3] = Math.floor(alpha * 225);
      }
    }
    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  },

  createRings: (ringColor) => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 8;
    const ctx = canvas.getContext('2d');

    const c = new THREE.Color(ringColor);
    const imgData = ctx.createImageData(canvas.width, canvas.height);

    for (let x = 0; x < canvas.width; x++) {
      const r = x / canvas.width;
      let alpha = 0.85;
      
      if (r > 0.68 && r < 0.73) {
        alpha = 0;
      } else {
        const wave = Math.sin(r * Math.PI * 80) * 0.25 + 0.65;
        const noise = noise3D(r * 200, 0.5, 0.5) * 0.15;
        alpha = Math.max(0.05, Math.min(0.9, wave + noise));
        
        if (r < 0.05) alpha *= (r / 0.05);
        if (r > 0.95) alpha *= ((1.0 - r) / 0.05);
      }

      for (let y = 0; y < canvas.height; y++) {
        const idx = (y * canvas.width + x) * 4;
        imgData.data[idx] = Math.floor(c.r * 255);
        imgData.data[idx + 1] = Math.floor(c.g * 255);
        imgData.data[idx + 2] = Math.floor(c.b * 255);
        imgData.data[idx + 3] = Math.floor(alpha * 255);
      }
    }
    ctx.putImageData(imgData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }
};
