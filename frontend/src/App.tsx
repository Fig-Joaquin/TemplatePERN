import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./components/AdminLayout";
import VehiclesPage from "./pages/vehiclesPage";
import ClientPage from "./pages/clientPage";
import QuotationPage from "./pages/quotationPage";
import QuotationCreatePage from "./pages/quotationCreatePage";
import ProductPage from "./pages/productPage";
import ProductCreatePage from "./pages/productCreatePage";
import EmployeePage from "./pages/employeePage";

export default function App() {
  return (
    <Routes>
      {/* Ruta pública */}
      <Route path="/" element={<Login />} />

      {/* Rutas protegidas dentro de AdminLayout */}
      <Route
        path="/admin"
        element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}
      >
        <Route path="dashboard" element={<Dashboard />} />
        {/* Puedes agregar más rutas dentro del layout aquí */}
        <Route path="vehiculos" element={<VehiclesPage />} />
        <Route path="clientes" element={<ClientPage />} />
        <Route path="cotizaciones" element={<QuotationPage />} />
        <Route path="cotizaciones/nuevo" element={<QuotationCreatePage />} />
        <Route path="productos" element={<ProductPage />} />
        <Route path="productos/nuevo" element={<ProductCreatePage />} />
        <Route path="trabajadores" element={<EmployeePage />} />
      </Route>

    </Routes>
  );
}
