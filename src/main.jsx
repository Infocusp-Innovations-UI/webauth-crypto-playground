import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import HashFlow from './HashFlow'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashFlow />
  </StrictMode>,
)
