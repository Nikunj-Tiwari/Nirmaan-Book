import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';
import { ConfigProvider } from './store/ConfigContext.jsx';
import { AuthProvider } from './store/AuthContext.jsx';
import { initTheme } from './components/ThemeToggle.jsx';

// Apply saved theme before React paints — prevents flash of wrong theme
initTheme();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ConfigProvider>
          <App />
        </ConfigProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
