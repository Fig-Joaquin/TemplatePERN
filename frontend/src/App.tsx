"use client"

// App.tsx

import { RouterProvider } from "react-router-dom"
import router from "@/routes/router"
import { useEffect } from "react"

function App() {
  useEffect(() => {
    // Check for dark mode preference
    if (
      localStorage.theme === "dark" ||
      (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [])

  return <RouterProvider router={router} />
}

export default App

