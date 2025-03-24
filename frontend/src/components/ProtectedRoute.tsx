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
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-10 h-10 border-4 border-gray-300 rounded-full border-t-blue-600 animate-spin"></div>
      </div>
    )
  }

  return isAuthenticated ? children : <Navigate to="/" />
}

export default ProtectedRoute

