function insertIndexedDB(data) {
    let request = indexedDB.open("pwa", 1);

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
                return new Response(JSON.stringify({ message: "Usuario guardado localmente y será sincronizado" }), {
                    headers: { "Content-Type": "application/json" }
                });
            })
        );
    }
});

self.addEventListener('sync', event => {
    if (event.tag === "syncUsers") {
        console.log("Intentando sincronizar usuarios...");
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


self.addEventListener('push', event => {
   
    const options = { 
        body: "hola",
        icon: "",
        image: ""
    };
        self.registration.showNotification("Titulo", options);
});

