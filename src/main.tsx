import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { toast } from 'sonner'
import { registerSW } from 'virtual:pwa-register'

const updateSW = registerSW({
  onNeedRefresh() {
    console.log("New version avaliable")
    toast.message('New version available', {
      description: 'Click to reload the app.',
      action: {
        label: 'Reload',
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        onClick: () => updateSW(true),
      },
    })
  },
  onOfflineReady() {
    toast.success('New App is ready!')
  },
})

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
if (import.meta.env.VITE_PROFILE !== "prod") {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  import('eruda').then(({ default: eruda }) => { eruda.init(); });
}



// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* Wrap the App component with BrowserRouter */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
