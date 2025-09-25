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
import WorkPaymentPage from "@/pages/work/workPayment";
import WorkPaymentFormPage from "@/pages/work/workPaymentFormPage";
import PaymentTypePage from "@/pages/work/paymentType";
import VehicleFormPage from "@/pages/vehicleFormPage";
import TaxesPage from "@/pages/work/Taxes";
import SupplierPage from "@/pages/SupplierPage";
import UsersPage from "@/pages/UsersPage";
import DebtorsPage from "@/pages/DebtorsPage";
import DebtorFormPage from "@/pages/DebtorFormPage";
import ProductPurchasesPage from "@/pages/ProductPurchasesPage";
import CreateProductPurchasePage from "@/pages/CreateProductPurchasePage";
import BalancesPage from "@/pages/BalancesPage";


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
      { path: "vehiculos/nuevo", element: <VehicleFormPage />, handle: { title: "Nuevo Vehículo" } },
      { path: "vehiculos/editar/:id", element: <VehicleFormPage />, handle: { title: "Editar Vehículo" } },
      { path: "clientes", element: <ClientPage />, handle: { title: "Clientes" } },
      { path: "proveedores", element: <SupplierPage />, handle: { title: "Proveedores" } },
      { path: "cotizaciones", element: <QuotationPage />, handle: { title: "Cotizaciones" } },
      { path: "cotizaciones/nuevo", element: <QuotationCreatePage />, handle: { title: "Nueva Cotización" } },
      { path: "cotizaciones/editar/:id", element: <EditQuotationPage />, handle: { title: "Editar Cotización" } },
      { path: "productos", element: <ProductPage />, handle: { title: "Productos" } },
      { path: "productos/nuevo", element: <ProductCreatePage />, handle: { title: "Nuevo Producto" } },
      { path: "compras-productos", element: <ProductPurchasesPage />, handle: { title: "Compras de Productos" } },
      { path: "compras-productos/nuevo", element: <CreateProductPurchasePage />, handle: { title: "Nueva Compra de Productos" } },
      { path: "categorias-productos", element: <ProductCategoryPage />, handle: { title: "Categorías de Productos" } },
      { path: "tipo-productos", element: <ProductTypePage />, handle: { title: "Tipos de Productos" } },
      { path: "marcas-vehiculos", element: <VehicleBrandPage />, handle: { title: "Marcas de Vehículos" } },
      { path: "modelos-vehiculos", element: <VehicleModelPage />, handle: { title: "Modelos de Vehículos" } },
      { path: "trabajadores", element: <EmployeePage />, handle: { title: "Trabajador" } },
      { path: "orden-trabajo", element: <WorkOrdersPage />, handle: { title: "Órdenes de Trabajo" } },
      { path: "orden-trabajo/editar/:id", element: <WorkOrderEditPage />, handle: { title: "Editar Orden de Trabajo" } },
      { path: "nueva-orden-trabajo", element: <WorkOrderCreatePage />, handle: { title: "Órdenes de Trabajo" } },
      { path: "empresas", element: <CompaniesPage />, handle: { title: "Empresas" } },
      { path: "finanzas/gastos", element: <GastosPage />, handle: { title: "Gastos" } },
      { path: "finanzas/gastos/nuevo", element: <GastoFormPage />, handle: { title: "Nuevo Gasto" } },
      { path: "finanzas/gastos/editar/:id", element: <GastoFormPage />, handle: { title: "Editar Gasto" } },
      { path: "finanzas/tipos-gasto", element: <TipoGastoPage />, handle: { title: "Tipos de Gasto" } },
      { path: "finanzas/pagos", element: <WorkPaymentPage />, handle: { title: "Pagos de Trabajo" } },
      { path: "finanzas/pagos/nuevo", element: <WorkPaymentFormPage />, handle: { title: "Nuevo Pago" } },
      { path: "finanzas/pagos/editar/:id", element: <WorkPaymentFormPage />, handle: { title: "Editar Pago" } },
      { path: "finanzas/tipos-pago", element: <PaymentTypePage />, handle: { title: "Tipos de Pago" } },
      { path: "finanzas/impuestos", element: <TaxesPage />, handle: { title: "Impuestos" } },
      { path: "finanzas/deudores", element: <DebtorsPage />, handle: { title: "Deudores" } },
      { path: "finanzas/deudores/nuevo", element: <DebtorFormPage />, handle: { title: "Nuevo Deudor" } },
      { path: "finanzas/deudores/editar/:id", element: <DebtorFormPage />, handle: { title: "Editar Deudor" } },
      { path: "finanzas/balances", element: <BalancesPage />, handle: { title: "Balances Financieros" } },
      { path: "configuracion/usuarios", element: <UsersPage />, handle: { title: "Usuarios" } },
      { path: "*", element: <h1>Not Found</h1> },
    ],
  },
])

export default router

