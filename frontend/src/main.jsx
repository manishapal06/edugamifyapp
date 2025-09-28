import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <p className='text-5xl'>Shubham Sharma </p>
    <App />
  </StrictMode>,
)
