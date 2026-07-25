import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/global.css';
import App from './App';
import { startClockSync } from './services/clockSync.service';

startClockSync(); // TODO: consider mounting this locally only when needed to reduce unessary request traffic 
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);