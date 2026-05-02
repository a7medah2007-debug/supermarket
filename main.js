// ========== main.js ==========
import 'movement.js';
import 'interactions.js';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';
import { SCENE, CAMERA, MALL, PRODUCTS, FRIDGES, JUICES, WATER, VEGETABLES, PRICE_BOARDS, STAFF, CARTS, WALKERS, SIGNS } from './config.js';
// ========== العناصر الأساسية ==========
const scene = new THREE.Scene();
scene.background = new THREE.Color(SCENE.background);


const camera = new THREE.PerspectiveCamera(CAMERA.fov, window.innerWidth / window.innerHeight, CAMERA.near, CAMERA.far);
camera.position.set(...CAMERA.position);

const renderer = new THREE.WebGLRenderer({ 
  antialias: true 
});
renderer.domElement.id = 'game-canvas';
document.body.appendChild(renderer.domElement);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.3;
renderer.xr.enabled = true;
document.body.appendChild(VRButton.createButton(renderer));
// ========== الإضاءة ==========
const ambientLight = new THREE.AmbientLight(SCENE.ambientLight.color, SCENE.ambientLight.intensity);
scene.add(ambientLight);
// إضاءة نصف كروية - تحل مشكلة الألوان السودا
const hemiLight = new THREE.HemisphereLight(
  SCENE.hemisphereLight.skyColor,
  SCENE.hemisphereLight.groundColor,
  SCENE.hemisphereLight.intensity
);
const directionalLight = new THREE.DirectionalLight(
  SCENE.directionalLight.color, 
  1.2  // أقوى
);
directionalLight.position.set(...SCENE.directionalLight.position);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 100;
directionalLight.shadow.camera.left = -30;
directionalLight.shadow.camera.right = 30;
directionalLight.shadow.camera.top = 30;
directionalLight.shadow.camera.bottom = -30;
scene.add(directionalLight);

SCENE.pointLights.forEach(pl => {
  const pointLight = new THREE.PointLight(pl.color, pl.intensity, 20);
  pointLight.position.set(...pl.position);
  scene.add(pointLight);
});

// ========== الأرضية ==========
const groundGeometry = new THREE.PlaneGeometry(SCENE.ground.width, SCENE.ground.height);
const groundMaterial = new THREE.MeshStandardMaterial({ 
  color: SCENE.ground.color,
  visible: SCENE.ground.visible 
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.1;
ground.receiveShadow = true;
scene.add(ground);
// ========== Controllers ==========
const controllerModelFactory = new XRControllerModelFactory();

const rightController = renderer.xr.getController(0);
rightController.addEventListener('selectstart', () => {
  if (!window.heldItem) {
    window.grabNearestProduct();
  }
});
rightController.addEventListener('selectend', () => {
  if (window.heldItem) {
    window.addToCart();
  }
});
rightController.addEventListener('squeezestart', () => {
  window.grabNearestProduct();
});
rightController.addEventListener('squeezeend', () => {
  if (window.heldItem) {
    window.throwItem();
  }
});
scene.add(rightController);

const rightGrip = renderer.xr.getControllerGrip(0);
rightGrip.add(controllerModelFactory.createControllerModel(rightGrip));
scene.add(rightGrip);

const leftController = renderer.xr.getController(1);
leftController.addEventListener('selectstart', () => {
  if (!window.attachedCart) {
    window.grabCart();
  } else {
    window.dropCart();
  }
});
leftController.addEventListener('squeezestart', () => {
  window.payAtCashier();
});
scene.add(leftController);

const leftGrip = renderer.xr.getControllerGrip(1);
leftGrip.add(controllerModelFactory.createControllerModel(leftGrip));
scene.add(leftGrip);


// ========== Joystick للحركة ==========
// شمال - Snap Turn 45°
let canSnapTurn = true;
leftController.addEventListener('axismove', (event) => {
  const axes = event.axes;
  if (axes && axes.length >= 2) {
    if (canSnapTurn && Math.abs(axes[2]) > 0.5) {
      const snapAngle = axes[2] > 0 ? -Math.PI/4 : Math.PI/4;
      camera.rotation.y += snapAngle;
      canSnapTurn = false;
      setTimeout(() => { canSnapTurn = true; }, 300);
    }
  }
});

// يمين - حركة
rightController.addEventListener('axismove', (event) => {
  const axes = event.axes;
  if (axes && axes.length >= 2) {
    playerState.moveRight = axes[2] > 0.3;
    playerState.moveLeft = axes[2] < -0.3;
    playerState.moveForward = axes[3] < -0.3;
    playerState.moveBackward = axes[3] > 0.3;
  }
});
// ========== الـ Loader ==========
const loader = new GLTFLoader();

// ========== دوال مساعدة ==========
function loadModel(path, position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1]) {
  return new Promise((resolve, reject) => {
    loader.load(
      path,
      (gltf) => {
        const model = gltf.scene;
        model.position.set(...position);
        model.rotation.set(...rotation);
        model.scale.set(...scale);
        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        scene.add(model);
        resolve(model);
      },
      undefined,
      (error) => {
        console.warn(`⚠️ فشل تحميل: ${path}`, error);
        resolve(null);
      }
    );
  });
}

function createPriceBoard(price, position, rotation, size) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  
  ctx.fillStyle = '#B8860B';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'white';
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${price} EGP`, canvas.width / 2, canvas.height / 2);
  
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.MeshBasicMaterial({ 
    map: texture,
    side: THREE.DoubleSide,
    transparent: true
  });
  const geometry = new THREE.PlaneGeometry(size[0], size[1]);
  const board = new THREE.Mesh(geometry, material);
  board.position.set(...position);
  board.rotation.set(...rotation);
  board.userData = { isPriceBoard: true };
  scene.add(board);
}

function fillShelf(productConfig) {
  const { model, price, scale, shelves } = productConfig;
  
  shelves.forEach(shelf => {
    const [startX, startY, startZ] = shelf.position;
    const { countX, countZ, spacingX, spacingZ, rotation } = shelf;
    
    for (let j = 0; j < (countZ || 1); j++) {
      for (let i = 0; i < (countX || 1); i++) {
        const x = startX + (i * (spacingX || 1));
        const z = startZ + (j * (spacingZ || 1));
        
        loadModel(model, [x, startY, z], rotation || [0, 0, 0], scale).then(item => {
          if (item) {
            item.userData = {
              isProduct: true,
              price: price,
              productType: model,
              originalPosition: [x, startY, z],
              originalRotation: rotation || [0, 0, 0],
            };
            window.allProducts.push(item);
          }
        });
      }
    }
  });
}

function fillFridge(fridgePos, fridgeRot, fridgeScale, drinkConfig) {
  loadModel(FRIDGES.model, fridgePos, fridgeRot, fridgeScale).then(fridge => {
    if (fridge) {
      fridge.userData = { isFridge: true };
    }
  });
  
  drinkConfig.inFridge.forEach(config => {
    const { startX, startY, startZ, shelves: shelvesCount, bottlesPerShelf, spacingY, spacingZ } = config;
    
    for (let s = 0; s < shelvesCount; s++) {
      const y = startY - (s * spacingY);
      
      for (let i = 0; i < bottlesPerShelf; i++) {
        const z = startZ + (i * spacingZ);
        
        loadModel(drinkConfig.model, [startX, y, z], [0, 0, 0], drinkConfig.scale).then(bottle => {
          if (bottle) {
            bottle.userData = {
              isProduct: true,
              price: drinkConfig.price,
              productType: 'drinks',
              originalPosition: [startX, y, z],
              originalRotation: [0, 0, 0],
            };
            window.allProducts.push(bottle);
          }
        });
      }
    }
  });
}

// ========== InstancedMesh للشيبسي ==========
const instancedMeshes = {};

async function fillShelfInstanced(productConfig) {
  const { model, price, scale, shelves } = productConfig;
  
  // تحميل الموديل مرة واحدة بس
  const gltf = await new Promise((resolve, reject) => {
    loader.load(model, resolve, undefined, reject);
  });
  
  if (!gltf) return;
  // نجمع كل الـ meshes من الموديل
  const meshes = [];
  gltf.scene.traverse((child) => {
    if (child.isMesh) {
      meshes.push(child);
    }
  });
  
  if (meshes.length === 0) return;
  
  // نحسب عدد كل المنتجات
  let totalInstances = 0;
  const allPositions = [];
  
  shelves.forEach(shelf => {
    const [startX, startY, startZ] = shelf.position;
    const { countX, countZ, spacingX, spacingZ, rotation } = shelf;
    
    for (let j = 0; j < (countZ || 1); j++) {
      for (let i = 0; i < (countX || 1); i++) {
        const x = startX + (i * (spacingX || 1));
        const z = startZ + (j * (spacingZ || 1));
        allPositions.push({ x, y: startY, z, rotation: rotation || [0, 0, 0], scale });
        totalInstances++;
      }
    }
  });
  
  // نعمل InstancedMesh لكل mesh في الموديل
  meshes.forEach((mesh) => {
    const instancedMesh = new THREE.InstancedMesh(
      mesh.geometry,
      mesh.material,
      totalInstances
    );
    instancedMesh.castShadow = true;
    instancedMesh.receiveShadow = true;
    
    const dummy = new THREE.Object3D();
    
    allPositions.forEach((pos, index) => {
      dummy.position.set(pos.x, pos.y, pos.z);
      dummy.rotation.set(...pos.rotation);
      dummy.scale.set(...pos.scale);
      dummy.updateMatrix();
      instancedMesh.setMatrixAt(index, dummy.matrix);
    });
    
    instancedMesh.instanceMatrix.needsUpdate = true;
    scene.add(instancedMesh);
    
    if (!instancedMeshes[model]) {
      instancedMeshes[model] = [];
    }
    instancedMeshes[model].push(instancedMesh);
  });
  
  // نخزن بيانات المنتجات عشان interactions
  allPositions.forEach((pos, index) => {
    window.allProducts.push({
      isInstanced: true,
instancedMesh: instancedMeshes[model] ? instancedMeshes[model][0] : null,
instanceIndex: index,
model: model,
      position: new THREE.Vector3(pos.x, pos.y, pos.z),
      rotation: new THREE.Euler(...pos.rotation),
      scale: new THREE.Vector3(...pos.scale),
      userData: {
        isProduct: true,
        price: price,
        productType: model,
        originalPosition: [pos.x, pos.y, pos.z],
        originalRotation: pos.rotation,
        inCart: false,
      },
      visible: true,
      getAttribute: function(attr) {
        if (attr === 'in-cart') return this.userData.inCart ? 'true' : null;
        if (attr === 'data-price') return this.userData.price;
        return null;
      },
      setAttribute: function(attr, value) {
        if (attr === 'in-cart') this.userData.inCart = value;
        if (attr === 'data-price') this.userData.price = value;
      },
      removeAttribute: function(attr) {
        if (attr === 'in-cart') this.userData.inCart = false;
      },
      position: {
        x: pos.x,
        y: pos.y,
        z: pos.z,
        set: function(x, y, z) {
          this.x = x;
          this.y = y;
          this.z = z;
        },
        copy: function(v) {
          this.x = v.x;
          this.y = v.y;
          this.z = v.z;
          return this;
        },
        clone: function() {
          return new THREE.Vector3(this.x, this.y, this.z);
        },
        distanceTo: function(v) {
          return Math.sqrt((this.x - v.x) ** 2 + (this.y - v.y) ** 2 + (this.z - v.z) ** 2);
        }
      },
      rotation: {
        set: function(x, y, z) {
          // مبسط
        },
        copy: function(v) {
          return this;
        },
        clone: function() {
          return new THREE.Euler();
        }
      },
    });
  });
  
  console.log(`✅ InstancedMesh: ${totalInstances} منتج من ${model}`);
}
async function loadVegetables(vegetableConfig) {
  for (const item of vegetableConfig.items) {
    const gltf = await new Promise((resolve, reject) => {
      loader.load(item.model, resolve, undefined, reject);
    });
    
    if (!gltf) continue;
    
    const meshes = [];
    gltf.scene.traverse((child) => {
      if (child.isMesh) meshes.push(child);
    });
    
    if (meshes.length === 0) continue;
    
    const count = item.count || 20;
    const boxW = item.boxSize[0]; // X
    const boxD = item.boxSize[1]; // Z
    const [cx, cy, cz] = item.position;
    const price = item.price || vegetableConfig.price || 15;
    
    meshes.forEach((mesh) => {
      const instancedMesh = new THREE.InstancedMesh(mesh.geometry, mesh.material, count);
      instancedMesh.castShadow = true;
      instancedMesh.receiveShadow = true;
      
      const dummy = new THREE.Object3D();
      
      for (let i = 0; i < count; i++) {
        const x = cx + (Math.random() - 0.5) * boxW * 0.8;
        const z = cz + (Math.random() - 0.5) * boxD * 0.8;
        const y = cy + Math.random() * 0.3;
        const rotY = Math.random() * Math.PI * 2;
        
        dummy.position.set(x, y, z);
        dummy.rotation.set(0, rotY, 0);
        dummy.scale.set(...(item.scale || [1, 1, 1]));
        dummy.updateMatrix();
        instancedMesh.setMatrixAt(i, dummy.matrix);
      }
      
      instancedMesh.instanceMatrix.needsUpdate = true;
      scene.add(instancedMesh);
      
      // تخزين بيانات المنتجات للتفاعل
      for (let i = 0; i < count; i++) {
        const m = new THREE.Matrix4();
        instancedMesh.getMatrixAt(i, m);
        const pos = new THREE.Vector3();
        const rot = new THREE.Quaternion();
        const scl = new THREE.Vector3();
        m.decompose(pos, rot, scl);
        
        window.allProducts.push({
          isInstanced: true,
          instancedMesh: instancedMesh,
          instanceIndex: i,
          model: item.model,
          position: pos,
          rotation: new THREE.Euler().setFromQuaternion(rot),
          scale: scl,
          userData: {
            isProduct: true,
            price: price,
            productType: item.model,
            originalPosition: [pos.x, pos.y, pos.z],
            originalRotation: [0, 0, 0],
            inCart: false,
          },
          visible: true,
          getAttribute: function(attr) {
            if (attr === 'in-cart') return this.userData.inCart ? 'true' : null;
            if (attr === 'data-price') return this.userData.price;
            return null;
          },
          setAttribute: function(attr, value) {
            if (attr === 'in-cart') this.userData.inCart = value;
            if (attr === 'data-price') this.userData.price = value;
          },
          removeAttribute: function(attr) {
            if (attr === 'in-cart') this.userData.inCart = false;
          },
        });
      }
      
      console.log(`🥕 ${item.model}: ${count} نسخة InstancedMesh`);
    });
  }
}
// ========== تحميل كل العناصر ==========
window.mixers = [];
async function initScene() {
  // المول
  await loadModel(MALL.model, MALL.position, [0, 0, 0], MALL.scale);
  
  // لوحات الأسعار
  PRICE_BOARDS.forEach(board => {
    createPriceBoard(board.price, board.position, board.rotation, board.size);
  });
  
  // الشيبسي
  // الشيبسي بـ InstancedMesh
if (PRODUCTS.chips2) await fillShelfInstanced(PRODUCTS.chips2);
if (PRODUCTS.chips3) await fillShelfInstanced(PRODUCTS.chips3);
  
  // الثلاجات والمشروبات
  // الثلاجة الأولى - عصير
fillFridge(FRIDGES.positions[0].position, FRIDGES.positions[0].rotation, FRIDGES.scale, JUICES);

// الثلاجة التانية - مياه
fillFridge(FRIDGES.positions[1].position, FRIDGES.positions[1].rotation, FRIDGES.scale, WATER);
  
  // الخضار
if (VEGETABLES) await loadVegetables(VEGETABLES);
  
  // العربات
  CARTS.positions.forEach(pos => {
    loadModel(CARTS.model, pos, [0, 0, 0], CARTS.scale).then(cart => {
      if (cart) {
        cart.userData = { isCart: true };
        window.allCarts.push(cart);
      }
    });
  });
  
  // الكاشير
  await loadModel(STAFF.cashier.model, STAFF.cashier.position, [0, 0, 0], STAFF.cashier.scale).then(cashier => {
    if (cashier) {
      cashier.userData = { isCashier: true };
      window.cashier = cashier;
    }
  });
  
  // الأمن
  // الأمن (كل الحراس)
if (STAFF.guards) {
  STAFF.guards.forEach((guardConfig, index) => {
    loadModel(guardConfig.model, guardConfig.position, [0, 0, 0], guardConfig.scale).then(guard => {
      if (guard) {
        guard.userData = { isGuard: true, guardIndex: index };
        if (index === STAFF.noPassZone.guardIndex) {
          window.noPassGuard = guard;
        }
      }
    });
  });
}
  
  // الناس المتحركة - أحجام مختلفة + بعضهم بعربة
if (WALKERS) {
  const models = WALKERS.models;
  const halfCount = WALKERS.count / 2;
  const cartModel = CARTS.model;
  
  // نحمل موديل العربة مرة واحدة بس
  let cartGltf = null;
  loader.load(cartModel, (gltf) => {
    cartGltf = gltf;
  });
  
  function createWalker(zone, modelPath) {
    const startX = zone.xMin + Math.random() * (zone.xMax - zone.xMin);
    const startZ = zone.zMin + Math.random() * (zone.zMax - zone.zMin);
    
    // حجم عشوائي
    const s = WALKERS.scaleMin + Math.random() * (WALKERS.scaleMax - WALKERS.scaleMin);
    
    loader.load(modelPath, (gltf) => {
      const walker = gltf.scene;
      walker.position.set(startX, 0, startZ);
      walker.scale.set(s, s, s);
      walker.userData = {
        isRandomWalker: true,
        zone: zone,
        speed: WALKERS.speed * (0.8 + Math.random() * 0.4),
        target: {
          x: zone.xMin + Math.random() * (zone.xMax - zone.xMin),
          z: zone.zMin + Math.random() * (zone.zMax - zone.zMin),
        },
      };
      
      // 30% احتمال يكون معاه سلة
      if (Math.random() < WALKERS.cartChance && cartGltf) {
        const cart = cartGltf.scene.clone();
        cart.scale.set(1.5, 1.5, 1.5);
        cart.position.set(0.6, -0.3, 0.8); // قدام الشخص
        walker.add(cart);
        walker.userData.hasCart = true;
      }
      
      scene.add(walker);
      window.allWalkers.push(walker);
      
      if (gltf.animations.length > 0) {
        const mixer = new THREE.AnimationMixer(walker);
        const action = mixer.clipAction(gltf.animations[0]);
        action.play();
        window.mixers.push(mixer);
      }
    });
  }
  
  // 5 في المنطقة 1
  for (let i = 0; i < halfCount; i++) {
    createWalker(WALKERS.zone1, models[i % models.length]);
  }
  
  // 5 في المنطقة 2
  for (let i = 0; i < halfCount; i++) {
    createWalker(WALKERS.zone2, models[i % models.length]);
  }
}
  
  // الإشارات
  SIGNS.forEach(sign => {
    loadModel(sign.model, sign.position, sign.rotation || [0, 0, 0], sign.scale);
  });
  // إخفاء شاشة التحميل
const loadingScreen = document.getElementById('loading-screen');
if (loadingScreen) {
  loadingScreen.style.opacity = '0';
  setTimeout(() => loadingScreen.remove(), 500);
}
  console.log('✅ تم تحميل المشهد بنجاح');
  console.log(`📦 المنتجات: ${window.allProducts.length}`);
  console.log(`🛒 العربات: ${window.allCarts.length}`);
  console.log(`🚶 المارة: ${window.allWalkers.length}`);
}

// ========== الحلقة الرئيسية ==========
function animate() {
  renderer.xr.addEventListener('sessionstart', () => {
    console.log('🥽 VR Started');
  });
  
  renderer.setAnimationLoop(function() {
    if (window.updateLoop) {
      window.updateLoop();
    }
    
    renderer.render(scene, camera);
  });
}

// ========== تصدير العناصر الأساسية ==========
export { scene, camera, renderer, loader, loadModel, createPriceBoard };

// ========== بدء التشغيل ==========
initScene().then(() => {
  animate();
});

// ========== التعامل مع تغيير حجم النافذة ==========
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
