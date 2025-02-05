import { ChevronDownIcon, Bars4Icon , Bars3Icon, TruckIcon, UsersIcon, ArchiveBoxIcon } from "@heroicons/react/24/solid";
import { useState } from "react";

const Sidebar = () => {
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className="relative">
      {/* Botón para abrir/cerrar el sidebar */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className={`absolute top-4 left-4 z-50 p-2 rounded-full shadow-md transition-colors duration-200 ${isSidebarOpen ? "bg-gray-100 hover:bg-gray-100" : "bg-white-200 hover:bg-white-300"}`}
      >
        {isSidebarOpen ? <Bars3Icon className="w-6 h-6 text-gray-700" /> : <Bars4Icon className="w-6 h-6 text-gray-700" />}
      </button>

      {/* Sidebar */}
      <aside className={`bg-white border-r border-gray-200 min-h-screen p-5 shadow-md transition-all duration-300 ${isSidebarOpen ? "w-64" : "w-16"}`}>
        <h2 className={`text-2xl font-bold mb-6 text-center text-gray-700 transition-opacity ${isSidebarOpen ? "opacity-100" : "opacity-0"}`}>Panel</h2>
        <nav>
          <ul className="space-y-4">
            <li>
              <button
                onClick={() => toggleSection("vehiculos")}
                className="flex items-center justify-between w-full text-left text-lg font-semibold text-gray-700 hover:bg-gray-100 p-2 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <TruckIcon className="w-6 h-6 text-gray-600" />
                  <span className={isSidebarOpen ? "block" : "hidden"}>Vehículos</span>
                </div>
                <ChevronDownIcon className={`w-5 h-5 transition-transform ${openSections["vehiculos"] ? "rotate-180" : ""}`} />
              </button>
              {openSections["vehiculos"] && isSidebarOpen && (
                <ul className="ml-4 space-y-2 mt-2 text-sm text-gray-600">
                  <li><a href="/admin/vehiculos" className="hover:text-blue-500">Ver Vehículos</a></li>
                  <li><a href="/admin/vehiculos/crear" className="hover:text-blue-500">Crear Vehículos</a></li>
                  <li><a href="/admin/vehiculos/editar" className="hover:text-blue-500">Editar Vehículos</a></li>
                  <li><a href="/admin/vehiculos/eliminar" className="hover:text-blue-500">Eliminar Vehículos</a></li>
                </ul>
              )}
            </li>
            <li>
              <button
                onClick={() => toggleSection("personas")}
                className="flex items-center justify-between w-full text-left text-lg font-semibold text-gray-700 hover:bg-gray-100 p-2 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <UsersIcon className="w-6 h-6 text-gray-600" />
                  <span className={isSidebarOpen ? "block" : "hidden"}>Personas</span>
                </div>
                <ChevronDownIcon className={`w-5 h-5 transition-transform ${openSections["personas"] ? "rotate-180" : ""}`} />
              </button>
              {openSections["personas"] && isSidebarOpen && (
                <ul className="ml-4 space-y-2 mt-2 text-sm text-gray-600">
                  <li><a href="/admin/personas" className="hover:text-blue-500">Ver Personas</a></li>
                  <li><a href="/admin/personas/crear" className="hover:text-blue-500">Crear Personas</a></li>
                  <li><a href="/admin/personas/editar" className="hover:text-blue-500">Editar Personas</a></li>
                  <li><a href="/admin/personas/eliminar" className="hover:text-blue-500">Eliminar Personas</a></li>
                </ul>
              )}
            </li>
            <li>
              <button
                onClick={() => toggleSection("inventario")}
                className="flex items-center justify-between w-full text-left text-lg font-semibold text-gray-700 hover:bg-gray-100 p-2 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <ArchiveBoxIcon className="w-6 h-6 text-gray-600" />
                  <span className={isSidebarOpen ? "block" : "hidden"}>Inventario</span>
                </div>
                <ChevronDownIcon className={`w-5 h-5 transition-transform ${openSections["inventario"] ? "rotate-180" : ""}`} />
              </button>
              {openSections["inventario"] && isSidebarOpen && (
                <ul className="ml-4 space-y-2 mt-2 text-sm text-gray-600">
                  <li><a href="/admin/inventario" className="hover:text-blue-500">Ver Inventario</a></li>
                  <li><a href="/admin/inventario/agregar" className="hover:text-blue-500">Agregar Inventario</a></li>
                  <li><a href="/admin/inventario/modificar" className="hover:text-blue-500">Modificar Inventario</a></li>
                  <li><a href="/admin/inventario/eliminar" className="hover:text-blue-500">Eliminar Inventario</a></li>
                </ul>
              )}
            </li>
          </ul>
        </nav>
      </aside>
    </div>
  );
};

export default Sidebar;