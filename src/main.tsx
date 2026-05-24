import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { LanguageProvider } from './context/LanguageContext.tsx';
import { APIProvider } from '@vis.gl/react-google-maps';

const GOOGLE_MAPS_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <APIProvider apiKey={GOOGLE_MAPS_KEY} version="weekly" language="vi" region="VN">
        <App />
      </APIProvider>
    </LanguageProvider>
  </StrictMode>,
);

