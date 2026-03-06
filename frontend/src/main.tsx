import React from 'react';
import ReactDOM from 'react-dom/client';
import '@arco-design/web-react/dist/css/arco.css';
import './styles/theme.css';
import App from './App';
import { useAuthStore } from '@/store/auth';

useAuthStore.getState().hydrate();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);