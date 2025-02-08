import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./components/AdminLayout";
import VehiclesPage from "./pages/vehiclesPage";
import ClientPage from "./pages/clientPage";
import QuotationPage from "./pages/quotationPage";
import QuotationCreatePage from "./pages/quotationCreatePage";

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
        <Route path="vehiculo" element={<VehiclesPage />} />
        <Route path="clientes" element={<ClientPage />} />
        <Route path="cotizacion" element={<QuotationPage />} />
        <Route path="cotizacion/create" element={<QuotationCreatePage />} />
      </Route>
      
    </Routes>
  );
}
