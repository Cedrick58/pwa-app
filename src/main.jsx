import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import keys from './keys.json'


navigator.serviceWorker.register('./sw.js', { type: 'module' })
  .then(registro => {
    console.log("ya se reg");
    if (Notification.permission === 'denied' || Notification.permission === 'default') {
      Notification.requestPermission(permission => {
        if (permission === 'granted') {
          registro.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: keys.publicKey
          })
          .then(res => res.toJSON())
          .then(async json => { // json tiene la suscripción
            console.log(json);
            // Guardar: enviar la suscripción a tu servidor
            fetch('/save-subscription', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ subscription: json })
            })
            .then(response => response.json())
            .then(data => console.log('Suscripción guardada:', data))
            .catch(error => console.error('Error al guardar la suscripción:', error));
          });
        }
      });
    }
  });


let db=window.indexedDB.open('database');
db.onupgradeneeded=event=>{
  let result=event.target.result;
  result.createObjectStore('libros',{autoIncrement: true});
}
/*.then(resp=>console.log("then", resp))
.catch(resp=>console.log("catch", resp))*/;

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
)
