const CACHE_NAME="2024-02-10 08:40",urlsToCache=["/type-yomi/","/type-yomi/index.js","/type-yomi/mp3/end.mp3","/type-yomi/mp3/correct3.mp3","/type-yomi/mp3/keyboard.mp3","/type-yomi/favicon/favicon.svg"];self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE_NAME).then(e=>e.addAll(urlsToCache)))}),self.addEventListener("fetch",e=>{e.respondWith(caches.match(e.request).then(t=>t||fetch(e.request)))}),self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(e=>Promise.all(e.filter(e=>e!==CACHE_NAME).map(e=>caches.delete(e)))))})