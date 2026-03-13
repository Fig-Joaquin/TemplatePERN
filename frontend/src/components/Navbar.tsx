"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { BellIcon } from "@heroicons/react/24/solid"
import type { User } from "../types/interfaces"
import { checkUserSession, userLogout } from "../services/userService"
import { useNavigate, useMatches } from "react-router-dom"
import DarkModeToggle from "@/components/darkModeToggle"
import { cn } from "@/lib/utils"
import Notifications from "./notification/Notification"
import { fetchNotifications } from "@/services/notification/notificationService"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface NavbarProps {
  onLogout?: () => void
  isSidebarOpen: boolean
}

interface Notification {
  notification_id: number;
  message: string;
  created_at: string;
  type?: "success" | "warning" | "info";
  read?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ onLogout, isSidebarOpen }) => {
  const [user, setUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<string | null | undefined>(undefined)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const quickLinks = [
    {
      href: "https://www.patentechile.com/",
      label: "Patente Chile",
    },
    {
      href: "https://empresas.officebanking.cl/",
      label: "Office Banking",
    },
    {
      href: "https://www.bancoestado.cl/content/bancoestado-public/cl/es/home/inicio---bancoestado-empresas.html#/login-empresa",
      label: "BancoEstado Empresas",
    },
  ]
  const navigate = useNavigate()
  const matches = useMatches()
  const currentMatch = matches.find((match) => (match.handle as { title?: string })?.title)
  const title = (currentMatch?.handle as { title?: string })?.title || "Dashboard"

  useEffect(() => {
    checkUserSession()
      .then((userData) => {
        setUser(userData)
        setUserRole(userData?.user?.userRole ?? null)
      })
      .catch(() => {
        setUser(null)
        setUserRole(null)
      })
  }, [])

  const isRoleResolved = userRole !== undefined
  const isContador = userRole === "contador"

  useEffect(() => {
    if (!isRoleResolved) {
      return
    }

    if (isContador) {
      setNotifications([])
      return
    }

    const loadNotifications = async () => {
      try {
        const notesData = await fetchNotifications();
        setNotifications(notesData || []);
      } catch (error) {
        console.error("Error loading notifications:", error);
      }
    };

    loadNotifications();
    const interval = setInterval(loadNotifications, 60000);
    return () => clearInterval(interval);
  }, [isContador, isRoleResolved]);

  const handleLogout = () => {
    userLogout()
    if (onLogout) onLogout()
    navigate("/")
  }

  return (
    <nav
      className={cn(
        "bg-sidebar",
        "border-r border-sidebar",
        "fixed top-0 bg-sidebar border-b border-border",
        "px-6 h-16 flex items-center justify-between z-30", // Cambiado z-50 a z-30
        "transition-all duration-300 shadow-sm",
        isSidebarOpen
          ? "left-72 w-[calc(100%-18rem)]" // Ajustado left-72 en lugar de left-64
          : "left-25 w-[calc(100%-6rem)]"  // Ajustado left-20 en lugar de left-16
      )}
    >
      <h1 className="text-xl font-bold text-foreground">{title}</h1>

      <div className="flex items-center gap-4">
        {isRoleResolved && !isContador && (
          <div className="hidden lg:flex items-center gap-2 rounded-xl border border-border bg-muted/40 p-1">
            {quickLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 text-sm font-medium text-foreground hover:text-primary hover:bg-background rounded-lg transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3">
          {isRoleResolved && !isContador && (
            <Popover open={showNotifications} onOpenChange={setShowNotifications}>
              <PopoverTrigger asChild>
                <button className="relative hover:text-primary transition-colors">
                  <BellIcon className="w-6 h-6 text-muted-foreground hover:text-primary" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-2 px-1 py-0.5 text-xs font-bold text-destructive-foreground bg-destructive rounded-full">
                      {notifications.length}
                    </span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0">
                <Notifications
                  notifications={notifications}
                  setNotifications={setNotifications}
                  onClose={() => setShowNotifications(false)}
                />
              </PopoverContent>
            </Popover>
          )}
          <DarkModeToggle />
        </div>

        <div className="flex items-center gap-3 border-l border-border pl-3">
          <img src="/OR_LOGO A&M.png" alt="Logo" className="h-10 w-auto" />
          {user && (
            <span className="hidden xl:inline text-foreground font-medium whitespace-nowrap">
              {user.person.name} {user.person.first_surname}
            </span>
          )}
          {user && (
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors cursor-pointer shadow-sm"
            >
              Cerrar Sesion
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar

