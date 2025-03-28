import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import '../styles/forms.css';

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

const Register = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');

    const handleRegister = async (e) => {
        e.preventDefault();
        const userData = { username, password };

        try {
            const response = await axios.post('https://pwa-api-47hz.onrender.com/register', userData);
            setMessage(response.data.message);
        } catch (error) {
            insertIndexedDB(userData);
            setMessage("No hay conexión. Usuario guardado y se enviará cuando haya internet.");
            if ('serviceWorker' in navigator && 'SyncManager' in window) {
                navigator.serviceWorker.ready.then(sw => {
                    sw.sync.register("syncUsers");
                });
            }
        }
    };

    return (
        <div className="form-container">
            <h2>Registro</h2>
            <form onSubmit={handleRegister}>
                <input
                    type="text"
                    placeholder="Usuario"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
                <input
                    type="password"
                    placeholder="Contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <button type="submit">Registrar</button>
            </form>
            <p>{message}</p>
            <p>
                ¿Ya tienes una cuenta? <Link to="/">Inicia sesión aquí</Link>
            </p>
        </div>
    );
};

export default Register;
