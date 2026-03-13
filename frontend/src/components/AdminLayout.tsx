"use client"

import { Outlet } from "react-router-dom"
import { useEffect, useState } from "react"
import Sidebar from "./Sidebar"
import Navbar from "./Navbar"
import { cn } from "@/lib/utils"
import { Chatbot}  from "./Chatbot"
import { checkUserSession } from "@/services/userService"

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    checkUserSession()
      .then((userData) => {
        setUserRole(userData?.user?.userRole ?? null)
      })
      .catch(() => {
        setUserRole(null)
      })
  }, [])

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar con z-index más alto */}
      <div className="fixed inset-y-0 left-0 z-40">
        <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      </div>

      {/* Contenido principal con margin izquierdo dinámico */}
      <div 
        className={cn(
          "flex-1 flex flex-col min-h-screen",
          "transition-all duration-300 ease-in-out",
          // Cambiamos el margen cuando está contraído de ml-20 a ml-28
          isSidebarOpen ? "ml-72" : "ml-28"  // ml-28 coincide con el w-28 del Sidebar
        )}
      >
        {/* Navbar con z-index más bajo que el sidebar */}
        <div className="sticky top-0 z-30">
          <Navbar isSidebarOpen={isSidebarOpen} />
        </div>

        {/* Contenido principal */}
        <main className="flex-1 p-6 mt-16">
          <Outlet />
        </main>
        
        {/* Chatbot */}
        {userRole !== "contador" && <Chatbot />}
      </div>
    </div>
  )
}

export default AdminLayout

