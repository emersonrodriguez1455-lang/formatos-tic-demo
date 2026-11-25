import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import App from './App.jsx'
import './index.css'
import { iniciarTecladoMovil } from './utils/tecladoMovil.js'
import { iniciarFaseCielo } from './config/cielo.js'

iniciarTecladoMovil()
iniciarFaseCielo()

function arrancar() {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <AuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthProvider>
    </React.StrictMode>,
  )
}

// Modo demostración (VITE_DEMO=true): la API responde desde el navegador con
// datos inventados (src/demo). Sin la bandera, la app arranca normal.
if (import.meta.env.VITE_DEMO === 'true') {
  import('./demo/apiDemo.js').then((m) => {
    m.install()
    arrancar()
  })
} else {
  arrancar()
}
