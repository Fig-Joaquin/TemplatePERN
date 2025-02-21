import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { toast } from "react-toastify";
import { getAllWorkOrders } from "@/services/workOrderService";
import WorkOrderCard from "@/components/workOrders/WorkOrderCard";
import { Button } from "@/components/ui/button";

const WorkOrdersPage = () => {
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  // Estado para ordenación: "recent" para más recientes, "oldest" para más antiguas.
  const [sortOrder, setSortOrder] = useState<"recent" | "oldest">("recent");
  // Cantidad de órdenes a mostrar
  const [visibleCount, setVisibleCount] = useState<number>(6);

  useEffect(() => {
    loadWorkOrders();
  }, []);

  const loadWorkOrders = async () => {
    setLoading(true);
    try {
      const data = await getAllWorkOrders();
      setWorkOrders(data);
    } catch (error) {
      toast.error("Error al cargar órdenes de trabajo");
    } finally {
      setLoading(false);
    }
  };

  // Mapeo de datos: si la orden tiene cotización, se toman los detalles de ésta; de lo contrario, los detalles directos.
  const data = workOrders.map((wo) => ({
    ...wo,
    details: wo.quotation ? wo.quotation.productDetails : wo.productDetails || [],
  }));

  // Filtrado por búsqueda: se busca en la matrícula, teléfono y nombre completo del dueño y de la empresa
  const searchLower = searchTerm.toLowerCase();
  const filteredWorkOrders = data.filter((wo) => {
    const vehicle = wo.vehicle;
    const plate = vehicle?.license_plate?.toLowerCase() || "";

    // Información del dueño
    const owner = vehicle?.owner;
    let ownerFullName = "";
    let ownerPhone = "";
    if (owner) {
      ownerFullName = `${owner.name || ""} ${owner.first_surname || ""} ${owner.second_surname || ""}`.toLowerCase();
      ownerPhone = owner.number_phone?.toLowerCase() || "";
    }

    // Información de la empresa
    const company = vehicle?.company;
    let companyName = "";
    let companyPhone = "";
    if (company) {
      companyName = company.name?.toLowerCase() || "";
      // Si la empresa posee un teléfono (por ejemplo, company.phone), se filtra también por él.
      companyPhone = company.phone?.toLowerCase() || "";
    }

    return (
      plate.includes(searchLower) ||
      ownerFullName.includes(searchLower) ||
      ownerPhone.includes(searchLower) ||
      companyName.includes(searchLower) ||
      companyPhone.includes(searchLower)
    );
  });

  // Ordenar por fecha según el criterio seleccionado
  const sortedWorkOrders = filteredWorkOrders.sort((a, b) => {
    if (sortOrder === "recent") {
      return new Date(b.order_date).getTime() - new Date(a.order_date).getTime();
    } else {
      return new Date(a.order_date).getTime() - new Date(b.order_date).getTime();
    }
  });

  // Mostrar solo las órdenes visibles según la paginación
  const visibleWorkOrders = sortedWorkOrders.slice(0, visibleCount);

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 6);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h1 className="text-2xl font-bold">Órdenes de Trabajo</h1>
        <div className="flex items-center gap-4">
          {/* Buscador */}
          <div className="relative w-72">
            <Input
              type="text"
              placeholder="Buscar por matrícula, teléfono o nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-2.5 w-5 h-5 text-muted-foreground" />
          </div>
          {/* Selector de ordenación */}
          <select
            value={sortOrder}
            onChange={(e) =>
              setSortOrder(e.target.value as "recent" | "oldest")
            }
            className="border rounded p-2"
          >
            <option value="recent">Más recientes</option>
            <option value="oldest">Más antiguas</option>
          </select>
        </div>
      </div>

      {/* Lista de órdenes */}
      {loading ? (
        <p>Cargando...</p>
      ) : visibleWorkOrders.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-4">
            {visibleWorkOrders.map((wo) => (
              <WorkOrderCard key={wo.work_order_id} workOrder={wo} />
            ))}
          </div>
          {/* Botón para cargar más, si existen más órdenes */}
          {visibleWorkOrders.length < sortedWorkOrders.length && (
            <div className="flex justify-center mt-4">
              <Button onClick={handleLoadMore}>Cargar más</Button>
            </div>
          )}
        </>
      ) : (
        <p>No se encontraron órdenes de trabajo.</p>
      )}
    </div>
  );
};

export default WorkOrdersPage;
