import './App.css'
import { ThemeProvider } from './components/theme-provider'
import HomePage from './pages/HomePage'
import { Route, Routes } from "react-router-dom";
import IndexPage from './pages/IndexPage';
import NotFoundPage from './pages/PageNotFound';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';
import AudioBookPage from './pages/AudioBookPage';
import { SonnerToastCustom } from './components/custom/soonerToast';
import { useEffect } from 'react';
import { wsClient } from './api/wsClient';
import { OperationProgressProvider } from './context/OperationProgressContext';
import { PreferencesProvider } from './context/PreferencesContext';
import { UpdateBanner } from './components/custom/UpdateBanner';

function App() {
  useEffect(() => {
    wsClient.connect();
  }, []);

  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <PreferencesProvider>
        <OperationProgressProvider>
          <UpdateBanner />
          <Routes>
            <Route element={<IndexPage />} path="/" />
            <Route element={<HomePage />} path="/home" />
            <Route element={<HomePage />} path="/home/*" />
            <Route element={<LoginPage />} path="/login" />
            <Route element={<AdminPage />} path="/admin" />
            <Route element={<AudioBookPage />} path="/audio-book" />



            <Route element={<NotFoundPage />} path="*" />
          </Routes>
          <SonnerToastCustom />
        </OperationProgressProvider>
      </PreferencesProvider>
    </ThemeProvider>
  )
}

export default App
