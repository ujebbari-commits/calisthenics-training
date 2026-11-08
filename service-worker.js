const CACHE='training-v73';
const ASSETS=['./','./index.html','./styles.css?v=20260916-1','./nutrition.css?v=20261104-2','./app.js?v=20260923-7','./level-config-v2.js?v=20260916-2','./program-mode-v2.js?v=20260916-3','./ui-v2.js?v=20261104-45','./nutrition.js?v=20261104-3','./timer.js?v=20261108-10','./manifest-v3.webmanifest?v=20261108-4','./training-biceps-192.png?v=2','./training-biceps-512.png?v=2','./training-biceps-maskable.svg?v=3'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));});
self.addEventListener('activate',e=>{e.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))),self.clients.claim()]));});
self.addEventListener('fetch',e=>{const req=e.request;if(req.mode==='navigate'){e.respondWith(fetch(req).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put('./index.html',copy));return r;}).catch(()=>caches.match('./index.html')));return;}e.respondWith(fetch(req).then(r=>{if(r&&r.ok&&req.method==='GET'){const copy=r.clone();caches.open(CACHE).then(c=>c.put(req,copy));}return r;}).catch(()=>caches.match(req)));});
// Allow tapping a lock-screen completion notification to return to the timer.
self.addEventListener('notificationclick',event=>{
  event.notification.close();
  event.waitUntil((async()=>{
    const clientsList=await clients.matchAll({type:'window',includeUncontrolled:true});
    const existing=clientsList.find(client=>client.url.startsWith(self.registration.scope));
    if(existing){await existing.focus();return;}
    await clients.openWindow('./');
  })());
});
