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
} from "@heroicons/react/24/solid";
import { useState } from "react";
import { Link } from "react-router-dom";

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
      { name: "Trabajadores", path: "/admin/" },
    ],
  },
  {
    id: "vehiculos",
    icon: TruckIcon,
    title: "Vehículos",
    items: [
      { name: "Lista de vehículos", path: "/admin/vehiculo" },
      { name: "Registrar vehículo", path: "/admin/vehiculos/nuevo" },
      { name: "Historial de kilometraje", path: "/admin/vehiculos/kilometraje" },
    ],
  },
  {
    id: "cotizaciones",
    icon: DocumentTextIcon,
    title: "Cotizaciones",
    items: [
      { name: "Lista de cotizaciones", path: "/admin/cotizaciones" },
      { name: "Nueva cotización", path: "/admin/cotizaciones/nueva" },
    ],
  },
  {
    id: "ordenes",
    icon: WrenchIcon,
    title: "Órdenes de Trabajo",
    items: [
      { name: "Lista de órdenes", path: "/admin/ordenes" },
      { name: "Crear orden", path: "/admin/ordenes/nueva" },
      { name: "Pagos de órdenes", path: "/admin/ordenes/pagos" },
    ],
  },
  {
    id: "inventario",
    icon: ArchiveBoxIcon,
    title: "Inventario",
    items: [
      { name: "Lista de productos", path: "/admin/inventario" },
      { name: "Registrar producto", path: "/admin/inventario/nuevo" },
      { name: "Compras", path: "/admin/inventario/compras" },
      { name: "Historial de compras", path: "/admin/inventario/historial" },
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
];

const Sidebar = ({
  isSidebarOpen,
  setIsSidebarOpen,
}: {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
}) => {
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({});

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  return (
      <div className="relative">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-md"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {isSidebarOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
        <aside
          className={`bg-white border-r border-gray-200 min-h-screen p-5 shadow-md fixed top-0 left-0 transition-all duration-300 ${
            isSidebarOpen ? "w-64" : "w-16"
          }`}
        >
        <h2
          className={`text-2xl font-bold mb-6 text-center text-gray-700 transition-opacity ${
            isSidebarOpen ? "opacity-100" : "opacity-0"
          }`}
        >
          Panel
        </h2>
        <nav>
          <ul className="space-y-4">
            {sidebarStructure.map((section) => (
              <li key={section.id}>
                <button
                  onClick={() => toggleSection(section.id)}
                  className="flex items-center justify-between w-full text-left text-lg font-semibold text-gray-700 hover:bg-gray-100 p-2 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <section.icon className="w-6 h-6 text-gray-600" />
                    <span className={isSidebarOpen ? "block" : "hidden"}>
                      {section.title}
                    </span>
                  </div>
                  {isSidebarOpen && (
                    <ChevronDownIcon
                      className={`w-5 h-5 transition-transform ${
                        openSections[section.id] ? "rotate-180" : ""
                      }`}
                    />
                  )}
                </button>
                {openSections[section.id] && isSidebarOpen && (
                  <ul className="ml-4 space-y-2 mt-2 text-sm text-gray-600">
                    {section.items.map((item) => (
                      <li key={item.path}>
                        <Link to={item.path} className="hover:text-blue-500">
                          {item.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </div>
  );
};

export default Sidebar;
