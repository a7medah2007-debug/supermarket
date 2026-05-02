// ========== movement.js ==========
// ========== movement.js ==========
import * as THREE from 'three';
import { scene, camera } from './main.js';
import { PLAYER, CAMERA, WALKERS, STAFF } from './config.js';

// ========== راي كاستر للتصادم ==========
const raycaster = new THREE.Raycaster();
const collisionDistance = 0.5;
// ========== حالة اللاعب ==========
const playerState = {
  moveForward: false,
  moveBackward: false,
  moveLeft: false,
  moveRight: false,
  moveUp: false,
  moveDown: false,
};

// ========== متغيرات العربة ==========
window.attachedCart = null; // العربة الممسوكة حاليًا
window.hasPaid = false; // هل دفع الحساب؟
// ========== تجميع العناصر ==========
window.allWalkers = [];
// الممرات والبوابات
window.corridorWalkers = {
  gateList: [],        // ناس بتخرج/تدخل من البوابة
  corridor1List: [],   // ناس بتخرج من الممر 1 للبوابة
  corridor2List: [],   // طابور الممر 2
  corridor3List: [],   // طابور الممر 3 (عكسي)
};
// ========== تحريك اللاعب ==========
// ========== تحريك اللاعب ==========
function updatePlayerMovement() {
  if (!camera) return;
  
  // اتجاه نظر الكاميرا
  const direction = new THREE.Vector3();
  camera.getWorldDirection(direction);
  direction.y = 0;
  direction.normalize();
  
  // الاتجاه الجانبي (عمودي)
  const sideDirection = new THREE.Vector3(-direction.z, 0, direction.x);
  
  const moveDelta = new THREE.Vector3();
  
  if (playerState.moveForward) moveDelta.add(direction);
  if (playerState.moveBackward) moveDelta.sub(direction);
  if (playerState.moveRight) moveDelta.add(sideDirection);
  if (playerState.moveLeft) moveDelta.sub(sideDirection);
  
  if (moveDelta.length() > 0) {
    moveDelta.normalize();
    moveDelta.multiplyScalar(PLAYER.moveSpeed);
    
    // ===== فحص التصادم =====
    const newPos = camera.position.clone();
    newPos.x += moveDelta.x;
    newPos.z += moveDelta.z;
    
    // فحص التصادم في X و Z بشكل منفصل
    const canMoveX = checkCollision(camera.position, new THREE.Vector3(moveDelta.x, 0, 0));
    const canMoveZ = checkCollision(camera.position, new THREE.Vector3(0, 0, moveDelta.z));
    
    if (canMoveX) camera.position.x += moveDelta.x;
    if (canMoveZ) camera.position.z += moveDelta.z;
  }
  
  // الحركة الرأسية
  if (playerState.moveUp) camera.position.y += PLAYER.verticalSpeed;
  if (playerState.moveDown) camera.position.y -= PLAYER.verticalSpeed;
  
  // قيود الارتفاع
  if (CAMERA.heightLimit) {
    camera.position.y = Math.max(CAMERA.heightLimit.min, Math.min(CAMERA.heightLimit.max, camera.position.y));
  }
  // بوابة الخروج - نهاية اللعبة
if (window.hasPaid) {
  const gate = WALKERS.gate;
  if (camera.position.x < gate.x + 1 && camera.position.x > gate.x - 1 &&
      camera.position.z > gate.zMin && camera.position.z < gate.zMax) {
    if (!window._gameEnded) {
      window._gameEnded = true;
      
      const endScreen = document.createElement('div');
      endScreen.id = 'end-screen';
      endScreen.style.cssText = `
        position: fixed;
        top: 0; left: 0;
        width: 100%; height: 100%;
        background: rgba(0,0,0,0.95);
        z-index: 99999;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: white;
        font-family: Arial, sans-serif;
      `;
      endScreen.innerHTML = `
        <h1 style="font-size: 48px; color: #FFD700; margin-bottom: 20px;">🎉 شكراً لتسوقك!</h1>
        <p style="font-size: 24px; color: #ccc; margin-bottom: 10px;">استمتع بمشترياتك</p>
        <p style="font-size: 18px; color: #aaa;">🛒 المتجر هايقفل دلوقتي...</p>
      `;
      document.body.appendChild(endScreen);
      
      setTimeout(() => {
        window.close();
      }, 8000);
    }
  }
}
  // منع العبور
  if (window.cartItems && window.cartItems.length > 0 && !window.hasPaid) {
    const zone = STAFF.noPassZone;
    const newX = camera.position.x;
    const newZ = camera.position.z;
    
    if (newX < zone.xMax && newX > zone.xMin && newZ < zone.zMax && newZ > zone.zMin) {
      camera.position.x -= moveDelta.x;
      camera.position.z -= moveDelta.z;
      
      if (!window._noPassMsgTime || Date.now() - window._noPassMsgTime > 3000) {
        window._noPassMsgTime = Date.now();
        alert('🛑 ارجع ادفع الحساب الأول عند الكاشير!');
      }
    }
  }
  
  
}

// دالة فحص التصادم
function checkCollision(from, direction) {
  raycaster.set(from, direction.normalize());
  raycaster.far = collisionDistance;
  
  // نشيل المنتجات والناس من الفحص قبل ما نبدأ
  const skipList = [];
  scene.traverse((obj) => {
    if (obj.userData && (obj.userData.isProduct || obj.userData.isWalker || obj.userData.isGuard || obj.userData.isCashier || obj.userData.isPriceBoard)) {
 skipList.push(obj);
    }
  });
  
  const intersects = raycaster.intersectObjects(scene.children, true);
  
  for (let i = 0; i < intersects.length; i++) {
    const obj = intersects[i].object;
    
    // نتجاهل الأرضية والعناصر الصغيرة
    if (obj.name === 'ground' || (obj.parent && obj.parent.name === 'ground')) continue;
    
    // نتجاهل الـ skip list
    if (skipList.includes(obj) || (obj.parent && skipList.includes(obj.parent))) continue;
    
    return false;
  }
  
  return true;
}


// ========== تحريك العربة الممسوكة ==========
function updateAttachedCart() {
  if (!window.attachedCart || !camera) return;
  
  const direction = new THREE.Vector3();
  camera.getWorldDirection(direction);
  direction.y = 0;
  direction.normalize();
  
  // العربة قدام اللاعب بمسافة
  const cartOffset = 1.8;
  window.attachedCart.position.x = camera.position.x + direction.x * cartOffset;
  window.attachedCart.position.z = camera.position.z + direction.z * cartOffset;
  window.attachedCart.position.y = 0.2;
  
  // توجيه العربة لنفس اتجاه اللاعب
  const angle = Math.atan2(direction.x, direction.z);
  window.attachedCart.rotation.y = angle;
}

// ========== تحريك الناس (Walkers) ==========
// ========== تحريك الناس (Walkers) - عشوائي ==========
// ========== تحريك الناس (Walkers) - عشوائي + ممرات ==========
function updateWalkers() {
  window.allWalkers.forEach(walker => {
    if (!walker.userData.isRandomWalker) return;
    
    const speed = walker.userData.speed || 0.03;
    const zone = walker.userData.zone;
    const target = walker.userData.target;
    
    // لو الشخص في رحلة انتقال بين المربعات
    if (walker.userData.isTraveling) {
      const dx = target.x - walker.position.x;
      const dz = target.z - walker.position.z;
      const distance = Math.sqrt(dx * dx + dz * dz);
      
      if (distance < 0.3) {
        // وصل للهدف، خلاص بقى في المربع التاني
        walker.userData.isTraveling = false;
        walker.userData.zone = target.zone;
        walker.userData.target = randomPointInZone(walker.userData.zone);
      } else {
        walker.position.x += (dx / distance) * speed;
        walker.position.z += (dz / distance) * speed;
        const angle = Math.atan2(dx, dz);
        walker.rotation.y = angle;
      }
      return;
    }
    
    // حركة عشوائية عادية جوه المربع
    const dx = target.x - walker.position.x;
    const dz = target.z - walker.position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    
    if (distance < 0.5) {
      // 5% احتمال انه يروح للمربع التاني عبر الممرات
      if (Math.random() < 0.005) {
        startTravel(walker);
        return;
      }
      // نقطة عشوائية جديدة
      walker.userData.target = randomPointInZone(zone);
    } else {
      walker.position.x += (dx / distance) * speed;
      walker.position.z += (dz / distance) * speed;
      const angle = Math.atan2(dx, dz);
      walker.rotation.y = angle;
    }
  });
  
  // تحريك ناس الممرات (corridor 2 و 3 - طوابير)
  moveCorridorWalkers();
}

function randomPointInZone(zone) {
  return {
    x: zone.xMin + Math.random() * (zone.xMax - zone.xMin),
    z: zone.zMin + Math.random() * (zone.zMax - zone.zMin),
  };
}

function getOtherZone(zone) {
  if (zone === WALKERS.zone1) return WALKERS.zone2;
  return WALKERS.zone1;
}

function startTravel(walker) {
  const currentZone = walker.userData.zone;
  const otherZone = getOtherZone(currentZone);
  
  // المربع 1 → المربع 2: يستخدم الممر 2 أو 3
  // المربع 2 → المربع 1: يستخدم الممر 2 أو 3 عكسي
  const corridor = Math.random() < 0.5 ? WALKERS.corridor2 : WALKERS.corridor3;
  
  walker.userData.isTraveling = true;
  walker.userData.target = {
    x: corridor.x,
    z: corridor.z,
    zone: otherZone,
  };
}

function moveCorridorWalkers() {
  // الممرات 2 و 3 كده كده جزء من حركة المشاة العادية
  // الـ gate والممر 1 ممكن نضيفهم كأشخاص منفصلين بعدين
}

// ========== الكاشير يتابع اللاعب ==========
function updateCashierLookAt() {
  if (window.cashier && camera) {
    // الكاشير يبص في عكس اتجاه اللاعب = وشه يبقى قدام اللاعب
    const dx = camera.position.x - window.cashier.position.x;
    const dz = camera.position.z - window.cashier.position.z;
    const angle = Math.atan2(dx, dz);
    window.cashier.rotation.y = angle + Math.PI;
  }
}
// ========== الحلقة الرئيسية للحركة ==========
window.updateLoop = function() {
  updatePlayerMovement();
  updateAttachedCart();  // ← أضف السطر ده
  updateWalkers();
  updateCashierLookAt();
  
  if (window.updateHeldItem) {
    window.updateHeldItem();
  }
  if (window.updateCartItems) {
    window.updateCartItems();
  }
  
  if (window.mixers) {
    window.mixers.forEach(mixer => mixer.update(0.016));
  }
};
// ========== ربط الأزرار ==========
function setupButton(id, stateKey) {
  const btn = document.getElementById(id);
  if (!btn) return;
  
  let interval = null;
  
  const startMove = (e) => {
    e.preventDefault();
    playerState[stateKey] = true;
    if (!interval) {
      interval = setInterval(() => {
        updatePlayerMovement();
      }, 16);
    }
  };
  
  const stopMove = (e) => {
    e.preventDefault();
    playerState[stateKey] = false;
    if (interval) {
      clearInterval(interval);
      interval = null;
    }
  };
  
  btn.addEventListener('mousedown', startMove);
  btn.addEventListener('mouseup', stopMove);
  btn.addEventListener('mouseleave', stopMove);
  btn.addEventListener('touchstart', startMove, { passive: false });
  btn.addEventListener('touchend', stopMove);
}

// ربط كل أزرار الحركة
setupButton('btn-forward', 'moveForward');
setupButton('btn-backward', 'moveBackward');
setupButton('btn-left', 'moveLeft');
setupButton('btn-right', 'moveRight');
setupButton('btn-up', 'moveUp');
setupButton('btn-down', 'moveDown');

// ========== زر تسجيل الإحداثيات ==========
document.getElementById('btn-get-pos')?.addEventListener('click', () => {
  if (camera) {
    const pos = camera.position;
    alert(`📍 الإحداثيات:\nX: ${pos.x.toFixed(2)}\nY: ${pos.y.toFixed(2)}\nZ: ${pos.z.toFixed(2)}`);
    console.log(`Camera Position: [${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)}]`);
  }
});

// ========== دعم لوحة المفاتيح ==========
document.addEventListener('keydown', (e) => {
  switch(e.key.toLowerCase()) {
    case 'w': playerState.moveForward = true; break;
    case 's': playerState.moveBackward = true; break;
    case 'a': playerState.moveLeft = true; break;
    case 'd': playerState.moveRight = true; break;
    case 'q': playerState.moveUp = true; break;
    case 'e': playerState.moveDown = true; break;
  }
});

document.addEventListener('keyup', (e) => {
  switch(e.key.toLowerCase()) {
    case 'w': playerState.moveForward = false; break;
    case 's': playerState.moveBackward = false; break;
    case 'a': playerState.moveLeft = false; break;
    case 'd': playerState.moveRight = false; break;
    case 'q': playerState.moveUp = false; break;
    case 'e': playerState.moveDown = false; break;
  }
});
// ========== دوران الكاميرا باللمس ==========
let touchStartX = 0;
let touchStartY = 0;
let yaw = 0;
let pitch = 0;

// نخزن اتجاه الكاميرا الابتدائي
if (camera) {
  const initialDir = new THREE.Vector3();
  camera.getWorldDirection(initialDir);
  yaw = Math.atan2(initialDir.x, initialDir.z);
  pitch = Math.asin(initialDir.y);
}

document.addEventListener('touchstart', (e) => {
  if (e.target.tagName === 'BUTTON') return; // متتدخلش مع الأزرار
  if (e.touches.length === 1) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }
}, { passive: false });

document.addEventListener('touchmove', (e) => {
  if (e.target.tagName === 'BUTTON') return;
  if (e.touches.length === 1) {
    e.preventDefault();
    const deltaX = e.touches[0].clientX - touchStartX;
    const deltaY = e.touches[0].clientY - touchStartY;
    
    const sensitivity = 0.005;
    yaw -= deltaX * sensitivity;
    pitch -= deltaY * sensitivity;
    
    // قيود على الـ pitch (عشان الكاميرا متقلبش)
    pitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, pitch));
    
    // تحديث اتجاه الكاميرا
    const direction = new THREE.Vector3(
      Math.sin(yaw) * Math.cos(pitch),
      Math.sin(pitch),
      Math.cos(yaw) * Math.cos(pitch)
    );
    
    const target = camera.position.clone().add(direction);
    camera.lookAt(target);
    
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }
}, { passive: false });

// ========== دوران الكاميرا بالماوس ==========
let isMouseDown = false;
let mouseStartX = 0;
let mouseStartY = 0;

document.addEventListener('mousedown', (e) => {
  if (e.target.tagName === 'BUTTON') return;
  isMouseDown = true;
  mouseStartX = e.clientX;
  mouseStartY = e.clientY;
});

document.addEventListener('mousemove', (e) => {
  if (!isMouseDown) return;
  if (e.target.tagName === 'BUTTON') return;
  
  const deltaX = e.clientX - mouseStartX;
  const deltaY = e.clientY - mouseStartY;
  
  const sensitivity = 0.002;
  yaw -= deltaX * sensitivity;
  pitch -= deltaY * sensitivity;
  
  pitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, pitch));
  
  const direction = new THREE.Vector3(
    Math.sin(yaw) * Math.cos(pitch),
    Math.sin(pitch),
    Math.cos(yaw) * Math.cos(pitch)
  );
  
  const target = camera.position.clone().add(direction);
  camera.lookAt(target);
  
  mouseStartX = e.clientX;
  mouseStartY = e.clientY;
});

document.addEventListener('mouseup', () => {
  isMouseDown = false;
});
console.log('✅ نظام الحركة جاهز');