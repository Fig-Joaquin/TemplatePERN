// router.tsx
import { createBrowserRouter } from "react-router-dom";
import Login from "@/pages/Login";
import { Dashboard } from "@/pages/Dashboard";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminLayout from "@/components/AdminLayout";
import VehiclesPage from "@/pages/vehiclesPage";
import ClientPage from "@/pages/clientPage";
import QuotationPage from "@/pages/quotationPage";
import QuotationCreatePage from "@/pages/quotationCreatePage";
import ProductPage from "@/pages/productPage";
import ProductCreatePage from "@/pages/productCreatePage";
import ProductCategoryPage from "@/pages/ProductCategoryPage";
import ProductTypePage from "@/pages/ProductTypePage";
import VehicleBrandPage from "@/pages/VehicleBrandPage";
import VehicleModelPage from "@/pages/VehicleModelPage";
import EmployeePage from "@/pages/employeePage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />,
  },
  {
    path: "/admin",
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: "dashboard", element: <Dashboard />, handle: { title: "Dashboard" } },
      { path: "vehiculos", element: <VehiclesPage />, handle: { title: "Vehículos" } },
      { path: "clientes", element: <ClientPage />, handle: { title: "Clientes" } },
      { path: "cotizaciones", element: <QuotationPage />, handle: { title: "Cotizaciones" } },
      { path: "cotizaciones/nuevo", element: <QuotationCreatePage />, handle: { title: "Nueva Cotización" } },
      { path: "productos", element: <ProductPage />, handle: { title: "Productos" } },
      { path: "productos/nuevo", element: <ProductCreatePage />, handle: { title: "Nuevo Producto" } },
      { path: "categorias-productos", element: <ProductCategoryPage />, handle: { title: "Categorías de Productos" } },
      { path: "tipo-productos", element: <ProductTypePage />, handle: { title: "Tipos de Productos" } },
      { path: "marcas-vehiculos", element: <VehicleBrandPage />, handle: { title: "Marcas de Vehículos" } },
      { path: "modelos-vehiculos", element: <VehicleModelPage />, handle: { title: "Modelos de Vehículos" } },
      { path: "trabajadores", element: <EmployeePage />, handle: { title: "Trabajador" } },

    ],
  },
])

export default router

