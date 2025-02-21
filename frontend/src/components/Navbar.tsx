"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { BellIcon } from "@heroicons/react/24/solid"
import type { User } from "../types/interfaces"
import { checkUserSession, userLogout } from "../services/userService"
import { useNavigate, useMatches } from "react-router-dom"
import DarkModeToggle from "@/components/darkModeToggle"

interface NavbarProps {
  onLogout?: () => void
  isSidebarOpen: boolean
}

const Navbar: React.FC<NavbarProps> = ({ onLogout, isSidebarOpen }) => {
  const [user, setUser] = useState<User | null>(null)
  const navigate = useNavigate()
  const matches = useMatches()
  const currentMatch = matches.find((match) => (match.handle as { title?: string })?.title)
  const title = (currentMatch?.handle as { title?: string })?.title || "Dashboard"

  useEffect(() => {
    checkUserSession()
      .then((userData) => {
        setUser(userData)
      })
      .catch(() => {
        setUser(null)
      })
  }, [])

  const handleLogout = () => {
    userLogout()
    if (onLogout) onLogout()
    navigate("/")
  }

  return (
    <nav
      className={`fixed top-0 bg-sidebar shadow px-6 h-16 flex items-center justify-between z-50 transition-all duration-300 
      ${isSidebarOpen ? "left-64 w-[calc(100%-16rem)]" : "left-16 w-[calc(100%-4rem)]"}`}
    >
      <h1 className="text-xl font-bold text-foreground">{title}</h1>

      <div className="flex items-center space-x-6">
        <button className="relative">
          <BellIcon className="w-6 h-6 text-muted-foreground" />
          <span className="absolute -top-1 -right-2 px-1 py-0.5 text-xs font-bold text-destructive-foreground bg-destructive rounded-full">
            3
          </span>
        </button>
        <DarkModeToggle />
        <img src="/OR_LOGO A&M.png" alt="Logo" className="h-10 w-auto center" />
        {user && (
          <span className="text-foreground font-medium">
            {user.person.name} {user.person.first_surname}
          </span>
        )}
        {user && (
          <button onClick={handleLogout} className="text-primary hover:underline">
            Logout
          </button>
        )}
      </div>
    </nav>
  )
}

export default Navbar

