"use client"

import { Navigate } from "react-router-dom"
import { useEffect, useState } from "react"
import api from "../utils/axiosConfig"

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await api.get("/auth/check-session")
        setIsAuthenticated(true)
      } catch {
        setIsAuthenticated(false)
      }
    }
    checkAuth()
  }, [])

  if (isAuthenticated === null) {
    return <p className="text-center mt-10">Verificando sesión...</p>
  }

  return isAuthenticated ? children : <Navigate to="/" />
}

export default ProtectedRoute

