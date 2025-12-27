// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// 1. Import the Leaflet fix and the Provider
import fixLeafletIcons from './fixLeafletIcons';
import { LiturgicalProvider } from './context/LiturgicalContext';

// 2. Fix icons before the app even starts
fixLeafletIcons();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 3. Wrap everything in the LiturgicalProvider */}
    <LiturgicalProvider>
      <App />
    </LiturgicalProvider>
  </React.StrictMode>
);