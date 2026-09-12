const CACHE='calisthenics-v7';
const ASSETS=['./','./index.html','./styles.css?v=20260912-3','./app.js?v=20260912-3','./app-v3.js?v=20260912-3','./app-v4.js?v=20260912-3','./manifest.webmanifest?v=20260912-3','./icon.svg'];

self.addEventListener('install',e=>{
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
});

self.addEventListener('activate',e=>{
  e.waitUntil(Promise.all([
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))),
    self.clients.claim()
  ]));
});

self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.mode==='navigate'){
    e.respondWith(fetch(req).then(r=>{
      const copy=r.clone();
      caches.open(CACHE).then(c=>c.put('./index.html',copy));
      return r;
    }).catch(()=>caches.match('./index.html')));
    return;
  }
  e.respondWith(fetch(req).then(r=>{
    if(r&&r.ok&&req.method==='GET'){
      const copy=r.clone();
      caches.open(CACHE).then(c=>c.put(req,copy));
    }
    return r;
  }).catch(()=>caches.match(req)));
});
