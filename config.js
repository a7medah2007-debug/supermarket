// ========== config.js ==========

export const SCENE = {
  background: 0x5D4037,
  ambientLight: { color: 0xfff5e6, intensity: 1.0 },
  directionalLight: { color: 0xfff5e6, intensity: 1.0, position: [5, 12, 5] },
  hemisphereLight: { skyColor: 0xffffff, groundColor: 0x5D4037, intensity: 0.6 },
  pointLights: [
    { color: 0xfff5e6, intensity: 0.8, position: [0, 5, 0] },
    { color: 0xfff5e6, intensity: 0.6, position: [-10, 3, 10] },
    { color: 0xfff5e6, intensity: 0.6, position: [10, 3, 10] },
    { color: 0xfff5e6, intensity: 0.5, position: [-20, 3, 50] },
    { color: 0xfff5e6, intensity: 0.5, position: [20, 3, 50] },
  ],
  ground: { width: 200, height: 200, color: 0x5D4037, visible: false }
};

export const CAMERA = {
  position: [-18.69, 1.6, -11.10],
  fov: 75,
  near: 0.1,
  far: 1000,
  heightLimit: { min: 0.5, max: 4.0 },
};

export const PLAYER = {
  moveSpeed: 1,
  verticalSpeed: 0.05,
};

export const MALL = {
  model: 'assets/models/mall.glb',
  position: [0, 0, 0],
  scale: [1, 1, 1],
};

export const PRODUCTS = {
  chips2: {
    name: 'شيبسي 15 جنيه',
    model: 'assets/models/chips2.glb',
    price: 15,
    scale: [0.5, 0.5, 0.5],
    shelves: [
      { position: [-4.33, 4.25, 59.69], countX: 15, countZ: 2, spacingX: 1.2, spacingZ: -0.5, rotation: [-80, 0, 0] },
      { position: [-4.33, 2.63, 59.69], countX: 15, countZ: 2, spacingX: 1.2, spacingZ: -0.5, rotation: [-80, 0, 0] },
    ]
  },
    chips3: {
    name: 'شيبسي 10 جنيه',
    model: 'assets/models/chips3.glb',
    price: 10,
    scale: [0.6, 0.6, 0.6],
    shelves: [
      { position: [19.20, 4.30, 40.85], countX: 2, countZ: 20, spacingX: -0.5, spacingZ: 1, rotation: [0, 80, -135] },
      { position: [19.20, 2.63, 40.85], countX: 2, countZ: 20, spacingX: -0.5, spacingZ: 1, rotation: [0, 80, -135] },
    ]
  }
};
export const FRIDGES = {
  model: 'assets/models/fridge.glb',
  scale: [4, 4, 4],
  positions: [
    { position: [-9.70, 0, 61.90], rotation: [0, -Math.PI/2, 0] },
    { position: [-9.70, 0, 65.50], rotation: [0, -Math.PI/2, 0] },
  ]
};

export const JUICES = {
  model: 'assets/models/can3.glb',
  name: 'عصير 25 جنيه',
  price: 25,
  scale: [0.5, 0.5, 0.5],
  inFridge: [
    { startX: -10.80, startY: 5.45, startZ: 60.50, shelves: 4, bottlesPerShelf: 10, spacingY: 1.2, spacingZ: 0.26 },
  ]
};

export const WATER = {
  model: 'assets/models/water.glb',
  name: 'مياه 10 جنيه',
  price: 10,
  scale: [0.1, 0.1, 0.1],
  inFridge: [
    { startX: -10.80, startY: 5.45, startZ: 64.10, shelves: 4, bottlesPerShelf: 10, spacingY: 1.2, spacingZ: 0.26 },
  ]
};
export const VEGETABLES = {
  items: [
    { model: 'assets/models/object_4.glb',  position: [-25.93, 2.0, 125.64], count: 20, scale: [2, 2, 2], boxSize: [2, 2], price: 10 },
    { model: 'assets/models/object_14.glb', position: [-25.93, 2.0, 129.64], count: 20, scale: [3, 3, 3], boxSize: [2, 2], price: 12 },
    { model: 'assets/models/object_16.glb', position: [-25.93, 2.0, 133.64], count: 20, scale: [3, 3, 3], boxSize: [2, 2], price: 15 },
    { model: 'assets/models/object_18.glb', position: [-25.93, 2.0, 137.47], count: 20, scale: [3, 3, 3], boxSize: [2, 2], price: 8  },
    { model: 'assets/models/object_20.glb', position: [-25.93, 2.0, 142.60], count: 20, scale: [3, 3, 3], boxSize: [2, 2], price: 20 },
  ]
};
export const PRICE_BOARDS = [
  { position: [-1.25, 3.75, 58.75], rotation: [0, 0, 0], price: 15, size: [1.5, 0.5] },
  { position: [7, 3.75, 58.75], rotation: [0, 0, 0], price: 15, size: [1.5, 0.5] },
  { position: [18.05, 3.75, 55], rotation: [0, -Math.PI/2, 0], price: 10, size: [1.5, 0.5] },
  { position: [18.05, 3.75, 46], rotation: [0, -Math.PI/2, 0], price: 10, size: [1.5, 0.5] },
  { position: [-10.82, 6.40, 72.3], rotation: [0, -Math.PI/2, 0], price: 25, size: [3, 1] },
  { position: [-33.19, 7.0, 135], rotation: [0, Math.PI/2, 0], price: 25, size: [3, 1] },
  { position: [-12.21, 7.0, 135], rotation: [0, -Math.PI/2, 0], price: 15, size: [3, 1] },
  { position: [-33.19, 7.0, 128], rotation: [0, Math.PI/2, 0], price: 25, size: [3, 1] },
  { position: [-12.21, 7.0, 128], rotation: [0, -Math.PI/2, 0], price: 15, size: [3, 1] },
];

export const STAFF = {
  cashier: {
    model: 'assets/models/human.glb',
    position: [-11.64, 3.00, 35.01],
    scale: [3, 3, 3],
  },
  guards: [
    { model: 'assets/models/guard.glb', position: [-17.57, 0, 114.34], scale: [4, 4, 4] },
    { model: 'assets/models/guard.glb', position: [-27.40, 0, 110.71], scale: [4, 4, 4] },
    { model: 'assets/models/guard.glb', position: [23.32, 0, -0.53], scale: [4, 4, 4] },
    { model: 'assets/models/guard.glb', position: [-17.55, 0, -2.13], scale: [4, 4, 4] },
  ],
  noPassZone: {
    guardIndex: 3,
    xMin: -20,
    xMax: 0,
    zMin: -14,
    zMax: -4.63,
  }
};

export const CARTS = {
  model: 'assets/models/cart.glb',
  scale: [4, 4, 4],
  positions: [
    [3.97, 0.2, 46.19],
    [13.15, 0.2, 42.12],
  ]
};

export const WALKERS = {
  models: ['assets/models/walker1.glb', 'assets/models/walker2.glb'],
  count: 10,
  speed: 0.2,
  scaleMin: 1.5,
  scaleMax: 1.75,
  cartChance: 0.0, 
  
  zone1: {
    xMin: -18.54,
    xMax: 9.19,
    zMin: -17.47,
    zMax: 28.88,
  },
  
  zone2: {
    xMin: -28.82,
    xMax: -16.20,
    zMin: 28.88,
    zMax: 119.91,
  },
  
  corridor1: { x: 9.48, zMin: -6.11, zMax: 4.60 },
  corridor2: { x: -28.82, z: 28.88 },
  corridor3: { x: -21.14, z: 28.88 },
  gate: { x: -18.75, zMin: -15.90, zMax: -5.50 },
};

export const SIGNS = [
  {
    model: 'assets/models/post.glb',
    position: [-23.20, 0, 114.34],
    scale: [200, 300, 300],
    text: 'STORAGE',
  },
  {
    model: 'assets/models/stop.glb',
    position: [-17.57, 0, 114.34],
    scale: [6, 6, 6],
  },
  {
    model: 'assets/models/post.glb',
    position: [20.88, 0, -2.44],
    rotation: [0, Math.PI/2, 0],
    scale: [200, 300, 300],
  },
  {
    model: 'assets/models/stop.glb',
    position: [20.89, 0, 1.07],
    rotation: [0, Math.PI/2, 0],
    scale: [6, 6, 6],
  },
];

export const SOUNDS = {
  cash: 'assets/sounds/Cash.mp3',
  space: 'assets/sounds/space.mp3',
  loss: 'assets/sounds/loss.mp3',
  much: 'assets/sounds/much.mp3',
};

export const GRABABLE_PRODUCTS = [
  'chips2', 'chips3', 'drinks', 'vegetables'
];