"use client"

import type React from "react"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import "react-toastify/dist/ReactToastify.css"
import api from "../utils/axiosConfig"
import { showSuccessToast, showErrorToast } from "../utils/toastConfig"
import { motion } from "framer-motion"

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
    <motion.div 
      className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary to-secondary"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card className="w-full max-w-md bg-card rounded-xl shadow-lg">
          <CardHeader className="text-center">
            <motion.h2 
              className="text-3xl font-bold text-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              Iniciar Sesión
            </motion.h2>
          </CardHeader>
          <CardContent>
            {error && (
              <motion.p 
                className="mt-3 text-destructive text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {error}
              </motion.p>
            )}
            <motion.form 
              onSubmit={handleLogin} 
              className="mt-6 space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
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
            </motion.form>
            <p className="mt-4 text-center text-muted-foreground text-sm">
              ¿Olvidaste tu contraseña?{" "}
              <a href="#" className="text-primary hover:underline">
                Recupérala aquí
              </a>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}

export default Login

