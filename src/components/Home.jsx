import React, { useEffect, useState, useCallback } from "react";
import keys from "../../keys.json"; // Importa las llaves VAPID
import { useNavigate } from "react-router-dom";
import "./Main.css"; // Importamos el archivo CSS

const Main = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");
  const userRole = localStorage.getItem("userRole");

  useEffect(() => {
    const fetchUsers = async () => {
      if (userRole !== "admin") {
        setIsLoading(false);
        return;
      }
      try {
        const response = await fetch("https://pwa-api-47hz.onrender.com/login");
        if (!response.ok) throw new Error("Error al obtener los usuarios");

        const data = await response.json();
        console.log("Usuarios obtenidos:", data);

        setUsers(data.filter(user => user.suscripcion));
      } catch (error) {
        console.error("Error al cargar los usuarios:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [userRole]);

  const registerServiceWorker = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.register("./sw.js", { type: "module" });

      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription || !userId) return;

      const permission = await Notification.requestPermission();
      if (permission !== "granted") return;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: keys.publicKey,
      });

      const response = await fetch("https://pwa-api-47hz.onrender.com/save-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, suscripcion: subscription.toJSON() }),
      });

      if (!response.ok) throw new Error(`Error en la solicitud: ${response.status}`);
      
      console.log("Suscripción guardada en la base de datos:", await response.json());
    } catch (error) {
      console.error("Error en el registro del Service Worker:", error);
    }
  }, [userId]);

  useEffect(() => {
    registerServiceWorker();
  }, [registerServiceWorker]);

  const handleSendMessage = async (user) => {
    try {
      const message = prompt(`Escribe un mensaje para ${user.email}:`);
      if (!message?.trim()) return alert("El mensaje no puede estar vacío.");

      if (!user.suscripcion) throw new Error(`El usuario ${user.email} no tiene una suscripción válida.`);

      console.log("Enviando a suscripción:", user.suscripcion);

      const response = await fetch("https://backend-be7l.onrender.com/auth/suscripcionMod", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suscripcion: user.suscripcion, mensaje: message }),
      });

      if (!response.ok) throw new Error("Error al enviar el mensaje");

      console.log("Mensaje enviado:", await response.json());
      alert("Mensaje enviado con éxito");
    } catch (error) {
      console.error("Error al enviar el mensaje:", error);
      alert(error.message);
    }
  };

  return (
    <div className="page-container">
      <h2 className="page-title">Bienvenid@</h2>
      {userRole === "admin" ? (
        <div>
          <h2>📋 Usuarios Suscritos</h2>
          {isLoading ? (
            <p>⏳ Cargando usuarios...</p>
          ) : (
            <table className="user-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>📩 Email</th>
                  <th>✉️ Enviar Mensaje</th>
                </tr>
              </thead>
              <tbody>
                {users.length ? (
                  users.map((user, index) => (
                    <tr key={user._id || index}>
                      <td>{user._id}</td>
                      <td>{user.email}</td>
                      <td>
                        <button className="send-message-btn" onClick={() => handleSendMessage(user)}>
                          Enviar
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3">📭 No hay usuarios suscritos</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <p>⚠️ No tienes permisos para ver esta página.</p>
      )}
    </div>
  );
};

export default Main;
