import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import WorkOrderWithQuotation from "@/components/workOrders/WorkOrderWithQuotation";
import WorkOrderWithoutQuotation from "@/components/workOrders/WorkOrderWithoutQuotation";
import { motion } from "framer-motion";
import { FileText, Plus, ArrowLeft, Wrench, Quote } from "lucide-react";

const WorkOrderCreatePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const vehicleIdFromUrl = queryParams.get('vehicleId');
  const withoutQuotation = queryParams.get('withoutQuotation') === 'true';

  const [activeTab, setActiveTab] = useState(withoutQuotation ? "without" : "with");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto p-6 space-y-6"
    >
      {/* Encabezado mejorado */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/admin/orden-trabajo")}
            className="hover:bg-primary/10"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Plus className="w-8 h-8 text-primary" />
              </div>
              Nueva Orden de Trabajo
            </h1>
            <p className="text-muted-foreground mt-1">
              Crea una nueva orden de trabajo con o sin cotización previa
            </p>
          </div>
        </div>
      </div>

      {/* Cards de opciones mejoradas */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <Card className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${activeTab === "with" ? "ring-2 ring-primary shadow-lg" : "hover:shadow-md"
          }`} onClick={() => setActiveTab("with")}>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-full w-fit">
              <Quote className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle className="text-blue-700 dark:text-blue-300">Con Cotización</CardTitle>
            <CardDescription>
              Crear orden basada en una cotización existente. Los productos y servicios ya están definidos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Productos pre-aprobados
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Precios acordados
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Proceso más rápido
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${activeTab === "without" ? "ring-2 ring-primary shadow-lg" : "hover:shadow-md"
          }`} onClick={() => setActiveTab("without")}>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-orange-50 dark:bg-orange-950/30 rounded-full w-fit">
              <Wrench className="w-8 h-8 text-orange-600 dark:text-orange-400" />
            </div>
            <CardTitle className="text-orange-700 dark:text-orange-300">Sin Cotización</CardTitle>
            <CardDescription>
              Crear orden de trabajo directamente, ideal para mantenimientos o reparaciones urgentes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Flexibilidad total
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Ideal para emergencias
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Configuración manual
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Contenido de las pestañas */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="hidden">
          <TabsTrigger value="with">Con Cotización</TabsTrigger>
          <TabsTrigger value="without">Sin Cotización</TabsTrigger>
        </TabsList>

        <TabsContent value="with" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Orden de Trabajo con Cotización
              </CardTitle>
              <CardDescription>
                Selecciona una cotización existente para crear la orden de trabajo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WorkOrderWithQuotation preselectedVehicleId={vehicleIdFromUrl ? Number(vehicleIdFromUrl) : undefined} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="without" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="w-5 h-5" />
                Orden de Trabajo sin Cotización
              </CardTitle>
              <CardDescription>
                Configura manualmente los productos y servicios para la orden de trabajo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WorkOrderWithoutQuotation preselectedVehicleId={vehicleIdFromUrl ? Number(vehicleIdFromUrl) : undefined} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default WorkOrderCreatePage;
