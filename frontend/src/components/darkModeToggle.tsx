import { useState, useEffect } from 'react'

const DarkModeToggle = () => {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // Verifica si hay una preferencia guardada
    const darkMode = localStorage.getItem('darkMode') === 'true'
    setIsDark(darkMode)
    if (darkMode) {
      document.documentElement.classList.add('dark')
    }
  }, [])

  const toggleDarkMode = () => {
    const newDarkMode = !isDark
    setIsDark(newDarkMode)
    localStorage.setItem('darkMode', newDarkMode.toString())
    
    // Toggle de la clase 'dark' en el elemento HTML
    document.documentElement.classList.toggle('dark')
  }

  return (
    <button
      onClick={toggleDarkMode}
      className="text-blue-600 hover:underline"
    >
      {isDark ? '🌞 Modo Claro' : '🌙 Modo Oscuro'}
    </button>
  )
}

export default DarkModeToggle