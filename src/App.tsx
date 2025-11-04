import './App.css'
import { ThemeProvider } from './components/theme-provider'
import HomePage from './pages/HomePage'
import { Route, Routes } from "react-router-dom";

function App() {

  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <Routes>
        <Route element={<HomePage />} path="/" />
      </Routes>
    </ThemeProvider>
  )
}

export default App
