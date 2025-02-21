import {
  HomeIcon,
  UsersIcon,
  TruckIcon,
  DocumentTextIcon,
  WrenchIcon,
  ArchiveBoxIcon,
  BanknotesIcon,
  Cog6ToothIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/solid"
import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

const sidebarStructure = [
  {
    id: "inicio",
    icon: HomeIcon,
    title: "Inicio",
    items: [{ name: "Dashboard", path: "/admin/dashboard" }],
  },
  {
    id: "Personas",
    icon: UsersIcon,
    title: "Personas",
    items: [
      { name: "Clientes", path: "/admin/clientes" },
      { name: "Trabajadores", path: "/admin/trabajadores" },
    ],
  },
  {
    id: "vehiculos",
    icon: TruckIcon,
    title: "Vehículos",
    items: [
      { name: "Lista de vehículos", path: "/admin/vehiculos" },
      { name: "Registrar vehículo", path: "/admin/vehiculos/nuevo" },
      { name: "Historial de kilometraje", path: "/admin/vehiculos/kilometraje" },
      { name: "Marcas de Vehículos", path: "/admin/marcas-vehiculos" },
      { name: "Modelos de Vehículos", path: "/admin/modelos-vehiculos" },
    ],
  },
  {
    id: "cotizaciones",
    icon: DocumentTextIcon,
    title: "Cotizaciones",
    items: [
      { name: "Lista de cotizaciones", path: "/admin/cotizaciones" },
      { name: "Nueva cotización", path: "/admin/cotizaciones/nuevo" },
    ],
  },
  {
    id: "ordenes",
    icon: WrenchIcon,
    title: "Órdenes de Trabajo",
    items: [
      { name: "Lista de órdenes", path: "/admin/orden-trabajo" },
      { name: "Crear orden", path: "/admin/nueva-orden-trabajo" },
      { name: "Pagos de órdenes", path: "/admin/ordenes/pagos" },
    ],
  },
  {
    id: "inventario",
    icon: ArchiveBoxIcon,
    title: "Inventario",
    items: [
      { name: "Lista de productos", path: "/admin/productos" },
      { name: "Registrar producto", path: "/admin/productos/nuevo" },
      { name: "Compras", path: "/admin/inventario/compras" },
      { name: "Historial de compras", path: "/admin/inventario/historial" },
      { name: "Categorias de productos", path: "/admin/categorias-productos" },
      { name: "Tipos de productos", path: "/admin/tipo-productos" },
    ],
  },
  {
    id: "finanzas",
    icon: BanknotesIcon,
    title: "Finanzas",
    items: [
      { name: "Pagos de clientes", path: "/admin/finanzas/pagos" },
      { name: "Impuestos", path: "/admin/finanzas/impuestos" },
    ],
  },
  {
    id: "configuracion",
    icon: Cog6ToothIcon,
    title: "Configuración",
    items: [
      { name: "Usuarios", path: "/admin/configuracion/usuarios" },
      { name: "Tipos de pago", path: "/admin/configuracion/tipos-pago" },
      { name: "Categorías de productos", path: "/admin/configuracion/categorias" },
    ],
  },
]

const Sidebar = ({
  isSidebarOpen,
  setIsSidebarOpen,
}: {
  isSidebarOpen: boolean
  setIsSidebarOpen: (open: boolean) => void
}) => {
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({})
  const location = useLocation()

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  return (
    <aside
      className={cn(
        "bg-sidebar",
        "border-r border-sidebar",
        "h-screen",
        "transition-all duration-300 ease-in-out",
        "overflow-y-auto scrollbar-thin scrollbar-track-muted",
        isSidebarOpen ? "w-72" : "w-28",
        "shadow-lg"
      )}
    >
      <div className="sticky top-0 z-20 flex items-center p-4 bg-sidebar border-b border-sidebar relative">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={cn(
            "flex items-center",
            isSidebarOpen ? "gap-3 pr-10" : "w-full justify-center"
          )}
        >
          <div
            className={cn(
              "rounded-xl flex items-center justify-center",
              "bg-white/10 backdrop-blur-sm",
              "w-12 h-12",
              // Agregamos cursor pointer y hover effect cuando está contraído
              !isSidebarOpen && "cursor-pointer hover:bg-sidebar-accent transition-colors"
            )}
            onClick={() => !isSidebarOpen && setIsSidebarOpen(true)}
          >
            <img 
              src="/OR_LOGO A&M-2.png" 
              alt="Logo A&M" 
              className="w-10 h-10 object-contain"
            />
          </div>
          {isSidebarOpen && (
            <h2 className="text-xl font-bold text-sidebar">
              Mecánica Automotriz A&M
            </h2>
          )}
        </motion.div>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={cn(
            "p-2 rounded-lg",
            "hover:bg-sidebar-accent",
            "transition-all duration-200",
            "text-sidebar hover:text-sidebar-accent",
            "active:scale-95",
            "flex items-center justify-center",
            "w-8 h-8",
            "absolute",
            "right-2", // Ya no necesitamos la posición -right-4
            "bg-sidebar",
            "top-1/2",
            "-translate-y-1/2",
            "shadow-md",
            "z-10",
            // Ocultamos el botón cuando está contraído
            !isSidebarOpen && "hidden"
          )}
        >
          <ChevronRightIcon className="w-5 h-5" />
        </button>
      </div>

      <nav className={cn("p-3", !isSidebarOpen && "flex flex-col items-center")}>
        <ul className={cn("space-y-1", !isSidebarOpen && "flex flex-col items-center w-full")}>
          {sidebarStructure.map((section) => (
            <li key={section.id}>
              <button
                onClick={() => toggleSection(section.id)}
                className={cn(
                  "w-full flex items-center justify-between",
                  "px-3 py-2.5 rounded-lg gap-3",
                  "transition-all duration-200",
                  "hover:bg-sidebar-accent",
                  "text-sidebar",
                  "active:scale-[0.98]",
                  openSections[section.id] && "bg-sidebar-accent text-sidebar-accent"
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <section.icon 
                    className={cn(
                      "w-5 h-5 shrink-0",
                      "transition-colors duration-200",
                      openSections[section.id] 
                        ? "text-sidebar-accent" 
                        : "text-sidebar"
                    )} 
                  />
                  {isSidebarOpen && (
                    <span className="text-sm font-medium truncate">
                      {section.title}
                    </span>
                  )}
                </div>
                {isSidebarOpen && (
                  <ChevronDownIcon
                    className={cn(
                      "w-4 h-4 transition-transform duration-200",
                      openSections[section.id] && "rotate-180"
                    )}
                  />
                )}
              </button>

              <AnimatePresence initial={false}>
                {openSections[section.id] && isSidebarOpen && (
                  <motion.ul
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden mt-1 ml-2"
                  >
                    {section.items.map((item) => {
                      const isActive = location.pathname === item.path
                      return (
                        <li key={item.path}>
                          <Link
                            to={item.path}
                            className={cn(
                              "flex items-center gap-2 w-full",
                              "px-6 py-2 rounded-lg",
                              "text-sm transition-all duration-200",
                              "text-sidebar",
                              "hover:bg-sidebar-accent",
                              "hover:text-sidebar-accent",
                              "active:scale-[0.98]",
                              isActive && "bg-sidebar-accent text-sidebar-accent font-medium"
                            )}
                          >
                            <span className="truncate">{item.name}</span>
                          </Link>
                        </li>
                      )
                    })}
                  </motion.ul>
                )}
              </AnimatePresence>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}

export default Sidebar

