const baseCameraPosition = Object.freeze({
  x: 0,
  y: 1.7,
  z: 8.4,
})

const orbitRadius = 38

export const worldConfig = Object.freeze({
  groundLevel: -1.28,
  sectionCount: 12,
  camera: Object.freeze({
    basePosition: baseCameraPosition,
    orbitRadius,
    lookDistance: 14,
    dragSectionDistance: 90,
    dragDirection: -1,
    transitionDamp: 1.85,
    orbitCenter: Object.freeze({
      x: 0,
      y: baseCameraPosition.y,
      z: baseCameraPosition.z + orbitRadius,
    }),
  }),
  ring: Object.freeze({
    groundInnerRadius: 44,
    groundOuterRadius: 78,
    baseInnerRadius: 42.4,
    baseOuterRadius: 79.6,
    forestInnerRadius: 50,
    forestOuterRadius: 74,
    hoverInnerRadius: 44.5,
    hoverOuterRadius: 78.4,
    segmentPadding: 0.09,
  }),
  entry: Object.freeze({
    cameraZ: baseCameraPosition.z,
    clearingCenter: Object.freeze({
      x: 0,
      z: -3.7,
    }),
    clearingRadius: 8,
    stonesForwardOffset: 16.4,
    stonesLateralOffset: 0.75,
  }),
  skyDial: Object.freeze({
    orbitRadius: 17,
    orbitCenter: Object.freeze({
      x: 0,
      y: -7.8,
      z: -24,
    }),
  }),
})

export const WORLD_TAU = Math.PI * 2
