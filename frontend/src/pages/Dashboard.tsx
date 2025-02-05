import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/axiosConfig";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

interface User {
  id: number;
  username: string;
  userRole: string;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data } = await api.get<{ user: User }>("/auth/check-session");
        setUser(data.user);
      } catch {
        navigate("/");
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, [navigate]);

  const handleLogout = async () => {
    await api.post("/auth/logout");
    navigate("/");
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen text-gray-600">Cargando...</div>;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="flex-1 p-6">
        <main className="grid grid-cols-3 gap-6 mt-6">
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-700">Ventas Diarias</h3>
            <p className="text-3xl font-bold text-green-500">$249.95</p>
            <p className="text-sm text-gray-500">67% Crecimiento</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-700">Ventas Mensuales</h3>
            <p className="text-3xl font-bold text-red-500">$2,942.32</p>
            <p className="text-sm text-gray-500">36% Disminución</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-700">Ventas Anuales</h3>
            <p className="text-3xl font-bold text-green-500">$8,638.32</p>
            <p className="text-sm text-gray-500">80% Crecimiento</p>
          </div>
        </main>
      </div>
    </div>
  );
}
