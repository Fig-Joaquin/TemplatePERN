"use client"

import { Outlet } from "react-router-dom"
import { useState } from "react"
import Sidebar from "./Sidebar"
import Navbar from "./Navbar"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { cn } from "@/lib/utils"

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

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
      </div>

      {/* Toast container mantiene el z-index más alto */}
      <ToastContainer className="z-50" />
    </div>
  )
}

export default AdminLayout

