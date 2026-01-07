import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import LoadingScreen from './components/LoadingScreen'
import BackgroundMusic from './components/BackgroundMusic'
import Home from './pages/Home'
import Login from './pages/Login'
import Admin from './pages/Admin'
import Chat from './pages/Chat'

function App() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Hide loading screen after 3 seconds
    const timer = setTimeout(() => {
      setLoading(false)
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <Router>
      <AnimatePresence mode="wait">
        {loading && <LoadingScreen key="loading" />}
      </AnimatePresence>

      <BackgroundMusic />

      {!loading && (
        <div className="app">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/chat" element={<Chat />} />
          </Routes>
        </div>
      )}
    </Router>
  )
}

export default App

