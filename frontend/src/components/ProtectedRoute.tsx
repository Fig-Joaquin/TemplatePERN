"use client"

import { Navigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { useLocation } from "react-router-dom"
import api from "../utils/axiosConfig"
import { DEFAULT_CONTADOR_ROUTE, isRouteAllowedByRole } from "@/utils/roleAccess"
import { toast } from "react-toastify"

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const location = useLocation()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await api.get("/auth/check-session")
        setUserRole(response.data?.user?.userRole ?? null)
        setIsAuthenticated(true)
      } catch {
        setIsAuthenticated(false)
      }
    }
    checkAuth()
  }, [location.pathname])

  const isRoleRestrictedRoute =
    isAuthenticated === true &&
    Boolean(userRole) &&
    !isRouteAllowedByRole(userRole as string, location.pathname)

  useEffect(() => {
    if (isRoleRestrictedRoute) {
      toast.error("No tienes permisos para realizar esta accion. Solo puedes visualizar finanzas.", {
        position: "top-right",
        autoClose: 3000,
        toastId: `contador-denied-${location.pathname}`,
      })
    }
  }, [isRoleRestrictedRoute, location.pathname])

  if (isAuthenticated === null) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-10 h-10 border-4 border-gray-300 rounded-full border-t-blue-600 animate-spin"></div>
      </div>
    )
  }

  if (isRoleRestrictedRoute) {
    return <Navigate to={DEFAULT_CONTADOR_ROUTE} replace />
  }

  return isAuthenticated ? children : <Navigate to="/" />
}

export default ProtectedRoute

