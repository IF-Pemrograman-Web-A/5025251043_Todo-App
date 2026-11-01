/* ------------------------------------------------------------------
 * Todo App Service Worker
 *
 * Caching strategy per resource:
 *   1. App shell (index.php?page=..., offline.html, style.css, script.js,
 *      manifest, icons)   -> PRECACHED on install
 *   2. Page navigations   -> network-first, fall back to cached shell,
 *                            then to offline.html
 *   3. CSS / JS / icons   -> stale-while-revalidate
 *   4. api.php?action=list -> network-first, fall back to last cached list
 *   5. uploads/ images    -> cache-first (uploaded files never change)
 *   6. POST / other       -> not handled (always goes to the network)
 * ------------------------------------------------------------------ */

const VERSION = "v3";
const SHELL_CACHE = "todo-shell-" + VERSION;
const DATA_CACHE = "todo-data-" + VERSION;
const IMAGE_CACHE = "todo-images-" + VERSION;
const CURRENT_CACHES = [SHELL_CACHE, DATA_CACHE, IMAGE_CACHE];

const NETWORK_TIMEOUT_MS = 4000;
const MAX_IMAGES = 60;

const PAGE_PERSONAL = "index.php?page=personal";
const PAGE_SHARED = "index.php?page=shared";
const OFFLINE_PAGE = "offline.html";

const PRECACHE = [
    PAGE_PERSONAL,
    PAGE_SHARED,
    OFFLINE_PAGE,
    "style.css",
    "script.js",
    "manifest.json",
    "icons/icon-192.png",
    "icons/icon-512.png",
    "icons/icon-maskable-512.png",
    "icons/apple-touch-icon.png",
    "icons/favicon-32.png"
];

const SCOPE = self.registration.scope;

function abs(path){
    return new URL(path, SCOPE).href;
}

/* ------------------------------ install ----------------------------- */

self.addEventListener(
    "install",
    function(event){
        event.waitUntil(
            caches
                .open(SHELL_CACHE)
                .then(function(cache){
                    // cache: "reload" skips the browser HTTP cache so the
                    // precache never stores a stale copy.
                    return cache.addAll(
                        PRECACHE.map(function(path){
                            return new Request(abs(path), { cache: "reload" });
                        })
                    );
                })
                .then(function(){
                    return self.skipWaiting();
                })
        );
    }
);

/* ----------------------------- activate ----------------------------- */

self.addEventListener(
    "activate",
    function(event){
        event.waitUntil(
            caches
                .keys()
                .then(function(keys){
                    return Promise.all(
                        keys
                            .filter(function(key){
                                return CURRENT_CACHES.indexOf(key) === -1;
                            })
                            .map(function(key){
                                return caches.delete(key);
                            })
                    );
                })
                .then(function(){
                    return self.clients.claim();
                })
        );
    }
);

/* ------------------------------ helpers ----------------------------- */

function fetchWithTimeout(request, ms){
    const controller = new AbortController();
    const timer = setTimeout(function(){
        controller.abort();
    }, ms);

    return fetch(request, { signal: controller.signal }).finally(function(){
        clearTimeout(timer);
    });
}

// Maps any URL that renders the app (/, /index.php, /index.php?page=shared)
// to one of the two precached shell URLs.
function shellKey(url){
    const isAppPage =
        url.pathname.endsWith("/index.php") ||
        url.pathname === new URL(SCOPE).pathname;

    if (!isAppPage)
        return null;

    return abs(url.searchParams.get("page") === "shared" ? PAGE_SHARED : PAGE_PERSONAL);
}

function apiKey(url){
    const scope = url.searchParams.get("scope") === "shared" ? "shared" : "personal";
    return abs("api.php?action=list&scope=" + scope);
}

function jsonError(message){
    return new Response(JSON.stringify({ error: message }), {
        status: 503,
        headers: { "Content-Type": "application/json" }
    });
}

async function trimCache(cacheName, maxItems){
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();

    for (let i = 0; i < keys.length - maxItems; i++)
        await cache.delete(keys[i]);
}

/* --------------------------- strategies ----------------------------- */

// Page navigations: network-first -> cached shell -> offline page
async function handleNavigation(request){
    const url = new URL(request.url);
    const key = shellKey(url);
    const cache = await caches.open(SHELL_CACHE);

    try{
        const response = await fetchWithTimeout(request, NETWORK_TIMEOUT_MS);

        if (key && response.ok)
            cache.put(key, response.clone());

        return response;
    }
    catch(error){
        const cached = key ? await cache.match(key) : null;

        return cached || cache.match(abs(OFFLINE_PAGE));
    }
}

// Static shell assets: serve the cached copy immediately, refresh in background
async function staleWhileRevalidate(request){
    const cache = await caches.open(SHELL_CACHE);
    const cached = await cache.match(request);

    const network = fetch(request)
        .then(function(response){
            if (response.ok)
                cache.put(request, response.clone());

            return response;
        })
        .catch(function(){
            return null;
        });

    if (cached)
        return cached;

    return (await network) || Response.error();
}

// Todo list API: network-first, last known list when offline
async function handleApiList(request){
    const url = new URL(request.url);
    const key = apiKey(url);
    const cache = await caches.open(DATA_CACHE);

    try{
        const response = await fetchWithTimeout(request, NETWORK_TIMEOUT_MS);

        if (response.ok)
            cache.put(key, response.clone());

        return response;
    }
    catch(error){
        const cached = await cache.match(key);

        return cached || jsonError("Offline dan belum ada data tersimpan.");
    }
}

// Uploaded images never change (random file names): cache-first
async function cacheFirst(request, cacheName){
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);

    if (cached)
        return cached;

    try{
        const response = await fetch(request);

        if (response.ok){
            await cache.put(request, response.clone());
            trimCache(cacheName, MAX_IMAGES);
        }

        return response;
    }
    catch(error){
        return Response.error();
    }
}

/* ------------------------------- fetch ------------------------------ */

self.addEventListener(
    "fetch",
    function(event){
        const request = event.request;

        if (request.method !== "GET")
            return;

        const url = new URL(request.url);

        if (url.origin !== self.location.origin)
            return;

        if (request.mode === "navigate"){
            event.respondWith(handleNavigation(request));
            return;
        }

        if (url.pathname.endsWith("/api.php")){
            if (url.searchParams.get("action") === "list")
                event.respondWith(handleApiList(request));

            return;
        }

        if (url.pathname.indexOf("/uploads/") !== -1){
            event.respondWith(cacheFirst(request, IMAGE_CACHE));
            return;
        }

        const isShellAsset = PRECACHE.some(function(path){
            return abs(path) === url.href || abs(path) === url.origin + url.pathname;
        });

        if (isShellAsset)
            event.respondWith(staleWhileRevalidate(request));
    }
);

/* ------------------------- messages / notifications ------------------ */

self.addEventListener(
    "message",
    function(event){
        if (event.data === "SKIP_WAITING")
            self.skipWaiting();
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
