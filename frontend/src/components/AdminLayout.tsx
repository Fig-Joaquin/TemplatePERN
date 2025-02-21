"use client"

import { Outlet } from "react-router-dom"
import { useState } from "react"
import Sidebar from "./Sidebar"
import Navbar from "./Navbar"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      <ToastContainer />
      <div className={`flex flex-col transition-all duration-300 ${isSidebarOpen ? "ml-64" : "ml-16"} w-full`}>
        <Navbar isSidebarOpen={isSidebarOpen} />
        <main className="p-6 mt-16 flex-grow">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout

