import './App.css'
import { ThemeProvider } from './components/theme-provider'
import HomePage from './pages/HomePage'
import { Route, Routes } from "react-router-dom";
import IndexPage from './pages/IndexPage';

function App() {

  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <Routes>
        <Route element={<IndexPage />} path="/" />
        <Route element={<HomePage />} path="/home"/>
        <Route element={<HomePage />} path="/home/*"/>

      </Routes>
    </ThemeProvider>
  )
}

export default App
