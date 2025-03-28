function insertIndexedDB(data) {
    let request = indexedDB.open("database", 1);

    request.onupgradeneeded = event => {
        let db = event.target.result;
        if (!db.objectStoreNames.contains("libros")) {
            db.createObjectStore("libros", { autoIncrement: true });
        }
    };

    request.onsuccess = event => {
        let db = event.target.result;
        let transaction = db.transaction("libros", "readwrite");
        let store = transaction.objectStore("libros");

        store.add(data);
        console.log("Usuario guardado en IndexedDB (sin conexión):", data);
    };
}

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open('appShellV4').then(cache => {
            return cache.addAll([
                "/src/index.css",
                "/src/App.jsx",
                "/src/main.jsx",
                "/src/components/Login.jsx",
                "/src/components/Register.jsx",
                "/src/styles/forms.css"
            ]);
        })
    );
    self.skipWaiting();
});

self.addEventListener("activate", event => {
    caches.delete("appShellV3");
    caches.delete("dinamicoV3");
});

self.addEventListener('fetch', event => {
    if (event.request.method === "POST" && event.request.url.includes("/register")) {
        event.respondWith(
            fetch(event.request).catch(() => {
                event.request.clone().json().then(data => {
                    insertIndexedDB(data);
                    self.registration.sync.register("syncUsers");
                });
                return new Response(JSON.stringify({ message: "Usuario guardado localmente, en proceso de sincronización" }), {
                    headers: { "Content-Type": "application/json" }
                });
            })
        );
    }
});

self.addEventListener('sync', event => {
    if (event.tag === "syncUsers") {
        console.log("Intentando sincronizar usuarios, esto puede tardar unos minutos...");
        event.waitUntil(
            new Promise((resolve, reject) => {
                let request = indexedDB.open("database", 1);
                request.onsuccess = event => {
                    let db = event.target.result;
                    let transaction = db.transaction("libros", "readwrite");
                    let store = transaction.objectStore("libros");

                    let getAllRequest = store.getAll();
                    getAllRequest.onsuccess = () => {
                        let users = getAllRequest.result;
                        if (users.length === 0) {
                            console.log("No hay usuarios pendientes de sincronización.");
                            return resolve();
                        }

                        let syncPromises = users.map(user =>
                            fetch("/register", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(user)
                            })
                        );

                        Promise.all(syncPromises)
                            .then(() => {
                                let clearTransaction = db.transaction("libros", "readwrite");
                                let clearStore = clearTransaction.objectStore("libros");
                                clearStore.clear();
                                console.log("Usuarios sincronizados y eliminados de IndexedDB.");
                                resolve();
                            })
                            .catch(reject);
                    };
                };
            })
        );
    }
});

console.log("el sw");

self.addEventListener('push', event=>{
    const options={
        body:"hola",
    }
    self.registration.showNotification("Titulo", options);
});

/*
self.addEventListener('fetch', event => {
    const requestUrl = new URL(event.request.url);

    // Verifica si la ruta está en el appShell
    if (isInAppShell(requestUrl.pathname)) {
        event.respondWith(
            caches.match(event.request).then(response => {
                return response || fetch(event.request);
            })
        );
    } else {
        // Si la ruta no está en appShell, la agrega a la caché dinámica
        event.respondWith(
            fetch(event.request)
            .then(response => {
                // Verifica que la respuesta sea válida y no provenga de una extensión
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }

                // Verifica que la solicitud no tenga esquema 'chrome-extension'
                if (event.request.url.startsWith('chrome-extension://')) {
                    return response; // No la guarda en caché
                }

                const responseClone = response.clone(); // Clonamos la respuesta aquí

                // Guardamos la respuesta en la caché dinámica
                caches.open('dinamico').then(cache => {
                    cache.put(event.request, responseClone); // Usamos el clon
                });

                return response; // Devuelve la respuesta original
            })
            .catch(() => caches.match(event.request)) // Si hay error, busca en caché
        );
    }
});

// Función que verifica si la ruta está en appShell
function isInAppShell(pathname) {
    const appShellRoutes = [
        "/src/index.css",
        "/src/App.jsx",
        "/src/main.jsx",
        "/src/components/Login.jsx",
        "/src/components/Register.jsx",
        "/src/styles/forms.css"
    ];

    return appShellRoutes.includes(pathname);
}*/
