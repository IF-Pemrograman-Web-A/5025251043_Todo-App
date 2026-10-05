const CACHE_NAME = "todo-v1";

const FILES = [
    "./",
    "index.html",
    "style.css",
    "script.js"
];

self.addEventListener(
    "install",
    function(event){
        event.waitUntil(
            caches
                .open(CACHE_NAME)
                .then(function(cache){
                    return cache.addAll(FILES);
                })
        );

        self.skipWaiting();
    }
);

self.addEventListener(
    "activate",
    function(event){
        event.waitUntil(
            caches.keys().then(function(keys){
                return Promise.all(
                    keys
                        .filter(function(key){
                            return key !== CACHE_NAME;
                        })
                        .map(function(key){
                            return caches.delete(key);
                        })
                );
            })
        );

        self.clients.claim();
    }
);

self.addEventListener(
    "fetch",
    function(event){
        if (event.request.method !== "GET")
            return;

        event.respondWith(
            caches
                .match(event.request)
                .then(function(cached){
                    return cached || fetch(event.request);
                })
        );
    }
);

self.addEventListener(
    "notificationclick",
    function(event){
        event.notification.close();

        event.waitUntil(
            clients
                .matchAll({ type: "window", includeUncontrolled: true })
                .then(function(windowClients){
                    if (windowClients.length > 0)
                        return windowClients[0].focus();

                    return clients.openWindow("./");
                })
        );
    }
);