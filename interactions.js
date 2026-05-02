// ========== interactions.js ==========
// ========== interactions.js ==========
import * as THREE from 'three';
import { scene, camera } from './main.js';
import { SOUNDS } from 'config.js';


// ========== حالة المستخدم ==========
window.heldItem = null;         // المنتج الممسوك حاليًا
window.attachedCart = null;     // العربة الممسوكة
window.cartItems = [];          // المنتجات في السلة
window.allProducts = [];        // كل المنتجات في المشهد
window.allCarts = [];           // كل العربات

// ========== عناصر الصفحة ==========
const infoPanel = document.getElementById('info-panel');

// ========== دوال مساعدة ==========
function getCameraPosition() {
  return camera.position.clone();
}

function getCartPosition() {
  if (window.attachedCart) {
    return window.attachedCart.position.clone();
  }
  // لو مفيش عربة ممسوكة، نستخدم موقع افتراضي قدام الكاميرا
  const camPos = getCameraPosition();
  const direction = new THREE.Vector3();
  camera.getWorldDirection(direction);
  direction.y = 0;
  direction.normalize();
  return new THREE.Vector3(
    camPos.x + direction.x * 1.5,
    camPos.y,
    camPos.z + direction.z * 1.5
  );
}

function updateInfoPanel() {
  const total = window.cartItems.reduce((sum, item) => {
    return sum + (item.userData.price || 10);
  }, 0);
  
  infoPanel.innerHTML = `🛒 السلة: ${window.cartItems.length} منتج | 💰 الإجمالي: ${total} جنيه`;
}

function playSound(soundPath) {
  const audio = new Audio(soundPath);
  audio.play().catch(e => console.log(`🔇 الصوت غير متوفر: ${soundPath}`));
}
// ========== تحديث موقع المنتج الممسوك ==========
function updateHeldItem() {
  if (!window.heldItem || !camera) return;
  
  const direction = new THREE.Vector3();
  camera.getWorldDirection(direction);
  direction.normalize();
  
  // المنتج قدام الكاميرا على اليمين شوية (زي ما يكون في إيدك اليمين)
  const rightOffset = new THREE.Vector3(-direction.z * 0.4, 0, direction.x * 0.4);
  
  window.heldItem.position.set(
    camera.position.x + direction.x * 1.5 + rightOffset.x,
    camera.position.y - 0.3,
    camera.position.z + direction.z * 1.5 + rightOffset.z
  );
  
  // المنتج يلف مع اتجاه الكاميرا
  window.heldItem.rotation.set(0, Math.atan2(direction.x, direction.z), 0);
}
window.updateHeldItem = updateHeldItem;
// ========== مسك المنتج ==========
function grabNearestProduct() {
  if (window.heldItem) {
    alert('أنت ممسك بمنتج بالفعل! ارميه أو حطه في السلة أولاً');
    return;
  }
  
  const camPos = getCameraPosition();
  let nearestProduct = null;
  let nearestDistance = 3;
  
  window.allProducts.forEach(product => {
    if (product.userData.inCart) return;
    const distance = camPos.distanceTo(product.position);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestProduct = product;
    }
  });
  
  if (nearestProduct) {
    nearestProduct.userData.originalPosition = nearestProduct.position.clone();
    nearestProduct.userData.originalRotation = nearestProduct.rotation.clone();
    
    if (nearestProduct.isInstanced && nearestProduct.instancedMesh) {
      const matrix = new THREE.Matrix4();
      matrix.makeScale(0, 0, 0);
      nearestProduct.instancedMesh.setMatrixAt(nearestProduct.instanceIndex, matrix);
      nearestProduct.instancedMesh.instanceMatrix.needsUpdate = true;
      
      const origMesh = nearestProduct.instancedMesh;
      const visualItem = new THREE.Mesh(origMesh.geometry, origMesh.material);
      visualItem.position.copy(nearestProduct.position);
      visualItem.userData = {...nearestProduct.userData, _originalRef: nearestProduct};
      scene.add(visualItem);
      window.heldItem = visualItem;
    } else {
  // منتج عادي (زجاجة مثلاً) - نستخدمه مباشرة
  window.heldItem = nearestProduct;
  // نضيفه للمشهد لو مش موجود
  if (!nearestProduct.parent) {
    scene.add(nearestProduct);
  }
}
    
    console.log('✅ تم مسك المنتج:', nearestProduct.userData.productType);
  } else {
    alert('لا يوجد منتج قريب للمسك! اقترب من الرفوف');
  }
}

// ========== رمي المنتج (إرجاعه لمكانه) ==========
function throwItem() {
  if (!window.heldItem) {
    alert('لا تمسك بأي منتج لترميه');
    return;
  }
  
  const item = window.heldItem;
  
  if (item.userData._originalRef) {
    const orig = item.userData._originalRef;
    const dummy = new THREE.Object3D();
    dummy.position.copy(orig.userData.originalPosition);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    orig.instancedMesh.setMatrixAt(orig.instanceIndex, dummy.matrix);
    orig.instancedMesh.instanceMatrix.needsUpdate = true;
    scene.remove(item);
  } else {
    item.position.copy(item.userData.originalPosition);
    item.rotation.copy(item.userData.originalRotation);
  }
  
  window.heldItem = null;
  console.log('🗑️ تم إرجاع المنتج لمكانه');
}

// ========== إضافة المنتج للسلة ==========
function addToCart() {
  if (!window.heldItem) {
    alert('لا تمسك بأي منتج! اقترب من منتج واضغط ✋ مسك منتج أولاً');
    return;
  }
  
  const product = window.heldItem;
  const originalRef = product.userData._originalRef || product;
  
  if (originalRef.userData.inCart) {
    alert('هذا المنتج موجود في السلة بالفعل');
    return;
  }
  
  // نحدد مكان السلة
  const cartPos = getCartPosition();
  
  // نحط المنتج فوق السلة
  const angle = Math.random() * Math.PI * 2;
  const radius = 0.4;
  product.position.set(
    cartPos.x + Math.cos(angle) * radius,
    2.5,
    cartPos.z + Math.sin(angle) * radius
  );
  product.rotation.set(0, Math.random() * Math.PI * 2, 0);
  
  originalRef.userData.inCart = true;
  originalRef.userData.cartPosition = cartPos.clone();
  originalRef.userData._cartVisual = product;
  
  window.cartItems.push(originalRef);
  window.heldItem = null;
  
  updateInfoPanel();
  console.log(`📦 تمت إضافة المنتج للسلة | عدد المنتجات: ${window.cartItems.length}`);
}
// ========== تحديث مواقع المنتجات في السلة ==========
function updateCartItems() {
  if (!window.attachedCart) return;
  
  const cartPos = window.attachedCart.position.clone();
  
  window.cartItems.forEach((item, index) => {
    if (item.userData.inCart && item.userData._cartVisual) {
      const angle = (index / window.cartItems.length) * Math.PI * 2;
      const radius = 0.4;
      // نحرك الـ visual item مش الـ data
      item.userData._cartVisual.position.set(
        cartPos.x + Math.cos(angle) * radius,
        2.5,
        cartPos.z + Math.sin(angle) * radius
      );
    }
  });
}
window.updateCartItems = updateCartItems;
// ========== مسك العربة ==========
function grabCart() {
  if (window.attachedCart) {
    alert('أنت ممسك بالعربة بالفعل!');
    return;
  }
  
  const camPos = getCameraPosition();
  let nearestCart = null;
  let nearestDistance = 5;
  
  window.allCarts.forEach(cart => {
    const distance = camPos.distanceTo(cart.position);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestCart = cart;
    }
  });
  
  if (nearestCart) {
    window.attachedCart = nearestCart;
    alert('🛒 تم مسك العربة! تحرك وهي هتتحرك وراك');
    console.log('🛒 تم مسك العربة');
  } else {
    alert('لا توجد عربة قريبة! اقترب من إحدى العربات');
  }
}

// ========== ترك العربة ==========
function dropCart() {
  if (!window.attachedCart) {
    alert('لا تمسك بأي عربة!');
    return;
  }
  
  window.attachedCart = null;
  alert('📍 تم ترك العربة في مكانها');
  console.log('📍 تم ترك العربة');
}

// ========== الدفع عند الكاشير ==========
// ========== الدفع عند الكاشير ==========
let paymentProcessed = false;

function payAtCashier() {
  if (!window.cashier) {
    alert('الكاشير غير موجود في المشهد!');
    return;
  }
  
  const camPos = getCameraPosition();
  const cashierPos = window.cashier.position;
  const distance = camPos.distanceTo(cashierPos);
  
  if (distance > 5.4) {
    alert('اقترب من الكاشير أولاً!');
    return;
  }
  
  if (window.cartItems.length === 0) {
    alert('سلتك فارغة! اشترِ بعض المنتجات أولاً');
    return;
  }
  
  if (paymentProcessed) {
    alert('تم الدفع بالفعل!');
    return;
  }
  
  paymentProcessed = true;
  
  // تشغيل صوت الكاش فورًا عند الاقتراب
  playSound(SOUNDS.cash);
  
  // حساب الإجمالي
  const total = window.cartItems.reduce((sum, item) => {
    return sum + (item.userData.price || 10);
  }, 0);
  
  const itemsCopy = [...window.cartItems];
  
  // إخراج المنتجات واحدة واحدة قدام الكاشير بفاصل زمني
  let index = 0;
  
  function ejectNextItem() {
    if (index < itemsCopy.length) {
      const product = itemsCopy[index];
      product.userData.inCart = false;
      product.position.set(
        cashierPos.x + (Math.random() - 0.5) * 1.5,
        cashierPos.y + 0.3,
        cashierPos.z + (Math.random() - 0.5) * 1.5
      );
      index++;
      setTimeout(ejectNextItem, 300); // كل 0.3 ثانية منتج
    } else {
      // كل المنتجات طلعت، نعرض اللوحة بعد ثانيتين
      setTimeout(() => {
        showPaymentBill(total, itemsCopy);
      }, 2000);
    }
  }
  
  window.cartItems = [];
  updateInfoPanel();
  ejectNextItem();
}

// ========== عرض لوحة الفاتورة ==========
// ========== عرض لوحة الفاتورة ==========
function showPaymentBill(total, items) {
  const billDiv = document.createElement('div');
  billDiv.id = 'payment-bill';
  billDiv.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: linear-gradient(135deg, #1a1a2e, #16213e);
    color: white;
    padding: 25px 30px;
    border-radius: 15px;
    z-index: 1000;
    text-align: center;
    font-family: 'Arial', sans-serif;
    border: 2px solid #FFD700;
    box-shadow: 0 0 30px rgba(255,215,0,0.3);
    min-width: 300px;
  `;
  
  const itemsList = items.map(item => {
    const name = item.userData.productType || 'منتج';
    const price = item.userData.price || 10;
    return `<li>${name.split('/').pop().replace('.glb','')} - ${price} جنيه</li>`;
  }).join('');
  
  billDiv.innerHTML = `
    <h2 style="color: #FFD700; margin-bottom: 15px;">🧾 الفاتورة</h2>
    <div style="text-align: right; margin: 10px 0; max-height: 200px; overflow-y: auto;">
      <ul style="list-style: none; padding: 0; color: #ccc; line-height: 1.8;">
        ${itemsList}
      </ul>
    </div>
    <hr style="border-color: #FFD700; margin: 15px 0;">
    <div style="font-size: 24px; font-weight: bold; color: #FFD700;">
      💰 الإجمالي: ${total} جنيه
    </div>
    <div style="margin-top: 15px; font-size: 14px; color: #aaa;">
      عدد المنتجات: ${items.length}
    </div>
    <button id="btn-confirm-pay" style="
      margin-top: 20px;
      padding: 12px 30px;
      background: #FFD700;
      color: #1a1a2e;
      border: none;
      border-radius: 25px;
      font-size: 18px;
      font-weight: bold;
      cursor: pointer;
    ">✅ ادفع ${total} جنيه</button>
  `;
  
  document.body.appendChild(billDiv);
  
  function returnItemsToCart() {
    let i = 0;
    function returnNext() {
      if (i < items.length) {
        const product = items[i];
        const cartPos = getCartPosition();
        const angle = Math.random() * Math.PI * 2;
        const radius = 0.5;
        product.position.set(
          cartPos.x + Math.cos(angle) * radius,
          cartPos.y + 0.6,
          cartPos.z + Math.sin(angle) * radius
        );
        product.rotation.set(0, Math.random() * Math.PI * 2, 0);
        product.userData.inCart = true;
        i++;
        setTimeout(returnNext, 300);
      } else {
        window.cartItems = [...items];
        updateInfoPanel();
        alert(`✅ شكراً لك! تم الدفع ${total} جنيه\n🛒 منتجاتك في السلة، خدها واتمتع!`);
       window.hasPaid = true;
 paymentProcessed = false;
      }
    }
    returnNext();
  }
  
  document.getElementById('btn-confirm-pay').addEventListener('click', () => {
    document.body.removeChild(billDiv);
    returnItemsToCart();
  });
}

// ========== ربط الأزرار ==========
document.getElementById('btn-grab-item')?.addEventListener('click', grabNearestProduct);
document.getElementById('btn-throw-item')?.addEventListener('click', throwItem);
document.getElementById('btn-add-to-cart')?.addEventListener('click', addToCart);
document.getElementById('btn-grab-cart')?.addEventListener('click', grabCart);
document.getElementById('btn-drop-cart')?.addEventListener('click', dropCart);
document.getElementById('btn-pay')?.addEventListener('click', payAtCashier);
window.grabNearestProduct = grabNearestProduct;
window.addToCart = addToCart;
window.throwItem = throwItem;
window.grabCart = grabCart;
window.dropCart = dropCart;
window.payAtCashier = payAtCashier;
console.log('✅ نظام التفاعلات جاهز');
