"use client";

import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Car, Search, Plus } from "lucide-react";
import { toast } from "react-toastify";
import type { Vehicle } from "../types/interfaces";
import { VehicleCard } from "@/components/VehicleCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchVehicles, deleteVehicle } from "@/services/vehicleService";
import { motion, AnimatePresence } from "framer-motion";

const VehiclesPage = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const vehiclesData = await fetchVehicles();
      setVehicles(vehiclesData);
    } catch (error: any) {
      toast.error(error.message || "Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredVehicles = vehicles.filter((vehicle) =>
    vehicle.license_plate.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (vehicleId: number) => {
    try {
      await deleteVehicle(vehicleId);
      toast.success("Vehículo eliminado exitosamente");
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al eliminar el vehículo");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
          <Car className="w-8 h-8" />
          Vehículos Registrados
        </h1>
        <Button 
          onClick={() => navigate("/admin/vehiculos/nuevo")} 
          className="bg-primary text-primary-foreground"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Vehículo
        </Button>
      </div>

      <div className="relative">
        <Input
          type="text"
          placeholder="Buscar vehículo por matrícula..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
      </div>

      {loading ? (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg text-muted-foreground">Cargando vehículos...</p>
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <AnimatePresence>
            {filteredVehicles.map((vehicle) => (
              <motion.div
                key={vehicle.vehicle_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <VehicleCard
                  vehicle={vehicle}
                  onEdit={() => navigate(`/admin/vehiculos/editar/${vehicle.vehicle_id}`)}
                  onDelete={() => handleDelete(vehicle.vehicle_id)}
                  showActions={true}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {filteredVehicles.length === 0 && !loading && (
        <div className="text-center py-10">
          <Car className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">
            {searchTerm ? "No se encontraron vehículos con esa matrícula" : "No hay vehículos registrados"}
          </p>
          {!searchTerm && (
            <Button 
              onClick={() => navigate("/admin/vehiculos/nuevo")} 
              className="mt-4"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar primer vehículo
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default VehiclesPage;
