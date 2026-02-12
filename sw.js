/* ═══════════════════════════════════════════════════════════════
   🔔 SERVICE WORKER - HEAL MATE
   إشعارات حقيقية + شغل بدون نت
   ═══════════════════════════════════════════════════════════════ */

const CACHE_NAME = 'heal-mate-v3';
const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js'
];

// 📥 التثبيت - تخزين الملفات للـ Offline
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: جاري التثبيت...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('📦 Service Worker: حفظ الملفات للاستخدام بدون نت');
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  
  self.skipWaiting(); // تفعيل فوري
});

// 🔄 التفعيل - مسح الكاش القديم
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker: تم التفعيل بنجاح!');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Service Worker: مسح كاش قديم:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  return self.clients.claim();
});

// 🌐 طلبات الشبكة - للشغل بدون نت
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // لو الملف موجود في الكاش، استخدمه
      if (response) {
        return response;
      }
      
      // لو مش موجود، جيبه من النت
      return fetch(event.request).then((response) => {
        // لو الطلب فشل، متعملش حاجة
        if (!response || response.status !== 200) {
          return response;
        }
        
        // خزن نسخة في الكاش
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        
        return response;
      });
    })
  );
});

// 🔔 معالجة الضغط على الإشعار وأزراره
self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  const action = event.action;
  const data = notification.data;
  
  notification.close();
  
  if (action === 'taken') {
    // المستخدم أخذ الدواء
    console.log(`✅ ${data.medName} تم أخذه`);
    
    // فتح التطبيق
    event.waitUntil(
      clients.openWindow('/#page-meds')
    );
    
  } else if (action === 'snooze') {
    // تأجيل 5 دقائق
    console.log(`⏰ ${data.medName} تم تأجيله`);
    
    // إعادة الإشعار بعد 5 دقائق
    event.waitUntil(
      new Promise((resolve) => {
        setTimeout(() => {
          self.registration.showNotification('⏰ HEAL MATE — تذكير مؤجل', {
            body: `تذكير: ${data.medName} (${data.time})`,
            icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="75" font-size="75">💊</text></svg>',
            vibrate: [300, 100, 300],
            tag: `med-${data.medName}-snooze`,
            requireInteraction: true,
            data: data
          });
          resolve();
        }, 5 * 60 * 1000); // 5 دقائق
      })
    );
    
  } else {
    // ضغط على الإشعار نفسه (مش على زر)
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
// 📢 إرسال إشعار تجريبي (اختياري)
self.addEventListener('push', (event) => {
  const title = '⏰ HEAL MATE';
  const options = {
    body: 'تذكير: حان وقت الدواء!',
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="75" font-size="75">💊</text></svg>',
    badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="75" font-size="75">💊</text></svg>',
    vibrate: [200, 100, 200],
    tag: 'medication-reminder'
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

console.log('✅ Service Worker جاهز للعمل!');