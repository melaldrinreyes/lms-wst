import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { registerSW } from 'virtual:pwa-register'

// Register Service Worker for PWA - vite-plugin-pwa handles this automatically
const updateSW = registerSW({
  onNeedRefresh() {
    console.log('🔄 New content available, please refresh.')
  },
  onOfflineReady() {
    console.log('✅ App ready to work offline!')
  },
  onRegistered(registration) {
    console.log('✅ PWA Service Worker registered')
  },
  onRegisterError(error) {
    console.log('❌ Service Worker registration failed:', error)
  }
})

createRoot(document.getElementById('root')).render(
  <App />
)
