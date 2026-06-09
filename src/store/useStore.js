import { create } from 'zustand';
import planetsData from '../../data/planets.json';
import discoveriesData from '../../data/discoveries.json';

const TOUR_ORDER = ['sun', 'mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];

export function getPlanetPosition(planetId, orbitTime) {
  const planet = planetsData.find(p => p.id === planetId);
  if (!planet || planetId === 'sun') return { x: 0, y: 0, z: 0 };
  
  const offsets = {
    mercury: 0.5,
    venus: 1.2,
    earth: 2.0,
    mars: 2.8,
    jupiter: 3.5,
    saturn: 4.3,
    uranus: 5.1,
    neptune: 5.8,
    pluto: 6.5
  };
  const offset = offsets[planetId] || 0;
  const angle = offset + orbitTime * planet.orbitSpeed;
  const x = Math.cos(angle) * planet.orbitRadius;
  const z = Math.sin(angle) * planet.orbitRadius;
  return { x, y: 0, z };
}

export const useStore = create((set, get) => ({
  // Phase state: 'landing' | 'countdown' | 'launch' | 'hub' | 'orbit' | 'travel'
  gamePhase: 'landing',
  orbitTime: 0,
  selectedPlanet: null, // Planet currently selected in HUD (before travel)
  activePlanet: null,   // Planet currently orbiting (detail view active)
  travelTarget: null,   // Planet we are currently warping towards
  
  // Persistence state
  visitedPlanets: JSON.parse(localStorage.getItem('solaris_visited') || '[]'),
  unlockedDiscoveries: JSON.parse(localStorage.getItem('solaris_discoveries') || '[]'),
  
  // UI modes
  photoMode: false,
  educationalMode: false,
  audioEnabled: false,
  journalOpen: false,
  
  // Dynamic Physics state
  orbitSpeedFactor: 1.0,
  showOrbitLines: true,
  showLabels: true,
  
  // Interactive Moons state
  activeMoon: null,
  
  // Guided Tour state
  guidedTourActive: false,
  tourStep: 0,
  
  // Setters
  setGamePhase: (gamePhase) => set({ gamePhase }),
  setOrbitSpeedFactor: (orbitSpeedFactor) => set({ orbitSpeedFactor }),
  toggleOrbitLines: () => set((state) => ({ showOrbitLines: !state.showOrbitLines })),
  toggleLabels: () => set((state) => ({ showLabels: !state.showLabels })),
  selectMoon: (activeMoon) => set({ activeMoon }),
  clearMoon: () => set({ activeMoon: null }),
  
  selectPlanet: (planetId) => {
    const planet = planetsData.find(p => p.id === planetId) || null;
    set({ selectedPlanet: planet });
  },
  
  startTravel: (planetId) => {
    const target = planetsData.find(p => p.id === planetId);
    if (!target) return;
    set({
      travelTarget: target,
      gamePhase: 'travel',
      selectedPlanet: target,
      photoMode: false,
      activeMoon: null
    });
  },
  
  arriveAtDestination: () => {
    const { travelTarget, visitedPlanets } = get();
    if (!travelTarget) return;
    
    const newVisited = [...new Set([...visitedPlanets, travelTarget.id])];
    localStorage.setItem('solaris_visited', JSON.stringify(newVisited));
    
    set({
      activePlanet: travelTarget,
      travelTarget: null,
      gamePhase: 'orbit',
      visitedPlanets: newVisited,
      activeMoon: null
    });
  },
  
  returnToHub: () => {
    set({
      activePlanet: null,
      selectedPlanet: null,
      travelTarget: null,
      gamePhase: 'hub',
      guidedTourActive: false,
      tourStep: 0,
      activeMoon: null
    });
  },
  
  unlockDiscovery: (discoveryId) => {
    const { unlockedDiscoveries } = get();
    if (unlockedDiscoveries.includes(discoveryId)) return false;
    
    const newDiscoveries = [...unlockedDiscoveries, discoveryId];
    localStorage.setItem('solaris_discoveries', JSON.stringify(newDiscoveries));
    set({ unlockedDiscoveries: newDiscoveries });
    return true;
  },
  
  togglePhotoMode: () => set(state => ({ photoMode: !state.photoMode })),
  toggleEducationalMode: () => set(state => ({ educationalMode: !state.educationalMode })),
  toggleAudioEnabled: () => set(state => ({ audioEnabled: !state.audioEnabled })),
  setJournalOpen: (journalOpen) => set({ journalOpen }),
  
  // Guided Tour Controls
  startGuidedTour: () => {
    set({
      guidedTourActive: true,
      tourStep: 0
    });
    get().startTravel(TOUR_ORDER[0]);
  },
  
  nextTourStep: () => {
    const { tourStep, guidedTourActive } = get();
    if (!guidedTourActive) return;
    
    const nextStep = tourStep + 1;
    if (nextStep < TOUR_ORDER.length) {
      set({ tourStep: nextStep });
      get().startTravel(TOUR_ORDER[nextStep]);
    } else {
      // Completed tour, go back to hub
      get().returnToHub();
    }
  },
  
  prevTourStep: () => {
    const { tourStep, guidedTourActive } = get();
    if (!guidedTourActive) return;
    
    const prevStep = tourStep - 1;
    if (prevStep >= 0) {
      set({ tourStep: prevStep });
      get().startTravel(TOUR_ORDER[prevStep]);
    }
  },
  
  exitGuidedTour: () => {
    set({
      guidedTourActive: false,
      tourStep: 0
    });
    get().returnToHub();
  },

  // Completion calculation
  getCompletionPercentage: () => {
    const { visitedPlanets, unlockedDiscoveries } = get();
    const totalItems = planetsData.length + discoveriesData.length;
    const completedItems = visitedPlanets.length + unlockedDiscoveries.length;
    return Math.round((completedItems / totalItems) * 100);
  }
}));
