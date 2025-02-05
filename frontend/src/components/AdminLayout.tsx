import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

const AdminLayout = () => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar con ancho fijo */}
      <Sidebar />

      {/* Contenedor principal que incluye el Navbar y el contenido */}
      <div className="flex flex-col flex-1">
        {/* Navbar ahora se ajusta al tamaño restante */}
        <Navbar />
        
        {/* Contenido con margen superior para evitar que se solape con el Navbar */}
        <main className="p-6 mt-16">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
