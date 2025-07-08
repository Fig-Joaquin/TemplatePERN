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
import EditQuotationPage from "@/pages/QuotationEditPage";
import ProductPage from "@/pages/productPage";
import ProductCreatePage from "@/pages/productCreatePage";
import ProductCategoryPage from "@/pages/ProductCategoryPage";
import ProductTypePage from "@/pages/ProductTypePage";
import VehicleBrandPage from "@/pages/VehicleBrandPage";
import VehicleModelPage from "@/pages/VehicleModelPage";
import EmployeePage from "@/pages/employeePage";
import WorkOrdersPage from "@/pages/WorkOrderPage";
import WorkOrderCreatePage from "@/pages/WorkOrderCreatePage";
import CompaniesPage from "@/pages/work/CompaniesPage";
import WorkOrderEditPage from "@/pages/WorkOrderEditPage";
import VehicleSearchPage from "@/pages/VehicleSearchPage";
import GastosPage from "@/pages/work/GastosPage";
import GastoFormPage from "@/pages/work/GastoFormPage";
import TipoGastoPage from "@/pages/work/TipoGastoPage";


const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />,
  },
  {
    path: "/consulta-vehiculo",
    element: <VehicleSearchPage />,
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
      { path: "cotizaciones/editar/:id", element: <EditQuotationPage />, handle: { title: "Editar Cotización" } },
      { path: "productos", element: <ProductPage />, handle: { title: "Productos" } },
      { path: "productos/nuevo", element: <ProductCreatePage />, handle: { title: "Nuevo Producto" } },
      { path: "categorias-productos", element: <ProductCategoryPage />, handle: { title: "Categorías de Productos" } },
      { path: "tipo-productos", element: <ProductTypePage />, handle: { title: "Tipos de Productos" } },
      { path: "marcas-vehiculos", element: <VehicleBrandPage />, handle: { title: "Marcas de Vehículos" } },
      { path: "modelos-vehiculos", element: <VehicleModelPage />, handle: { title: "Modelos de Vehículos" } },
      { path: "trabajadores", element: <EmployeePage />, handle: { title: "Trabajador" } },
      { path: "orden-trabajo", element: <WorkOrdersPage />, handle: { title: "Órdenes de Trabajo" } },
      { path: "orden-trabajo/editar/:id", element: <WorkOrderEditPage />, handle: { title: "Editar Orden de Trabajo" } },
      { path: "nueva-orden-trabajo", element: <WorkOrderCreatePage />, handle: { title: "Órdenes de Trabajo" } },
      { path: "empresas", element: <CompaniesPage />, handle: { title: "Empresas" } },
      { path: "gastos", element: <GastosPage />, handle: { title: "Gastos" } },
      { path: "gastos/nuevo", element: <GastoFormPage />, handle: { title: "Nuevo Gasto" } },
      { path: "gastos/editar/:id", element: <GastoFormPage />, handle: { title: "Editar Gasto" } },
      { path: "tipos-gasto", element: <TipoGastoPage />, handle: { title: "Tipos de Gasto" } },
      { path: "*", element: <h1>Not Found</h1> },
    ],
  },
])

export default router

