"use client"

import type React from "react"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import "react-toastify/dist/ReactToastify.css"
import api from "../utils/axiosConfig"
import { showSuccessToast, showErrorToast } from "../utils/toastConfig"

// Import shadcn/ui components
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

const Login = () => {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    try {
      const response = await api.post("/auth/login", { username, password }, { withCredentials: true })

      if (response.status === 200) {
        showSuccessToast("Inicio de sesión exitoso")
        navigate("/admin/dashboard")
      }
    } catch (err) {
      setError("Credenciales incorrectas. Intenta de nuevo.")
      showErrorToast("Error al iniciar sesión. Verifica tus credenciales.")
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary to-secondary">
      <Card className="w-full max-w-md bg-card rounded-xl shadow-lg">
        <CardHeader className="text-center">
          <h2 className="text-3xl font-bold text-foreground">Iniciar Sesión</h2>
        </CardHeader>
        <CardContent>
          {error && <p className="mt-3 text-destructive text-center">{error}</p>}
          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="username" className="block text-sm font-medium text-foreground">
                Usuario
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label htmlFor="password" className="block text-sm font-medium text-foreground">
                Contraseña
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1"
                required
              />
            </div>
            <Button type="submit" className="w-full bg-primary text-primary-foreground">
              Iniciar Sesión
            </Button>
          </form>
          <p className="mt-4 text-center text-muted-foreground text-sm">
            ¿Olvidaste tu contraseña?{" "}
            <a href="#" className="text-primary hover:underline">
              Recupérala aquí
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default Login

