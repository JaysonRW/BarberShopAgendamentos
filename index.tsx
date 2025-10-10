

import React from 'react';
import ReactDOM from 'react-dom/client';
// FIX: The original path was './src/App' which can be ambiguous. Specifying './src/App.tsx' is more explicit. The root cause of the error is that `App.tsx` did not have a default export, which is now fixed.
import App from './src/App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Elemento root não encontrado para montagem");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);