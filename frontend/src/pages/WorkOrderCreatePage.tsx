import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import WorkOrderWithQuotation from "@/components/workOrders/WorkOrderWithQuotation";
import WorkOrderWithoutQuotation from "@/components/workOrders/WorkOrderWithoutQuotation";
import { motion } from "framer-motion";
import { ArrowLeft, Wrench, FileCheck, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const WorkOrderCreatePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const vehicleIdFromUrl = queryParams.get('vehicleId');
  const withoutQuotation = queryParams.get('withoutQuotation') === 'true';

  const [activeTab, setActiveTab] = useState(withoutQuotation ? "without" : "with");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="container mx-auto px-4 sm:px-6 py-6 max-w-6xl"
    >
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/admin/orden-trabajo")}
          className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a órdenes
        </Button>

        <h1 className="text-2xl font-semibold text-foreground">
          Nueva Orden de Trabajo
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Seleccione el método de creación
        </p>
      </div>

      {/* Selection Cards */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {/* Con Cotización */}
        <Card
          className={cn(
            "cursor-pointer transition-all duration-200 border",
            activeTab === "with"
              ? "border-primary bg-primary/5 dark:bg-primary/10"
              : "border-border hover:border-muted-foreground/30"
          )}
          onClick={() => setActiveTab("with")}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="p-2 rounded-md bg-muted">
                <FileCheck className="w-5 h-5 text-foreground" />
              </div>
              {activeTab === "with" && (
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-3 h-3 text-primary-foreground" />
                </div>
              )}
            </div>
            <CardTitle className="text-base font-medium mt-3">
              Con Cotización
            </CardTitle>
            <CardDescription className="text-sm">
              Basada en una cotización aprobada con productos y precios definidos.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="text-xs text-muted-foreground space-y-1.5">
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-muted-foreground"></span>
                Productos pre-aprobados
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-muted-foreground"></span>
                Precios acordados
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-muted-foreground"></span>
                Proceso simplificado
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Sin Cotización */}
        <Card
          className={cn(
            "cursor-pointer transition-all duration-200 border",
            activeTab === "without"
              ? "border-primary bg-primary/5 dark:bg-primary/10"
              : "border-border hover:border-muted-foreground/30"
          )}
          onClick={() => setActiveTab("without")}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="p-2 rounded-md bg-muted">
                <Wrench className="w-5 h-5 text-foreground" />
              </div>
              {activeTab === "without" && (
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-3 h-3 text-primary-foreground" />
                </div>
              )}
            </div>
            <CardTitle className="text-base font-medium mt-3">
              Sin Cotización
            </CardTitle>
            <CardDescription className="text-sm">
              Orden directa para trabajos urgentes o mantenimientos programados.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="text-xs text-muted-foreground space-y-1.5">
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-muted-foreground"></span>
                Configuración manual
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-muted-foreground"></span>
                Ideal para emergencias
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-muted-foreground"></span>
                Control total
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Form Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="hidden">
          <TabsTrigger value="with">Con Cotización</TabsTrigger>
          <TabsTrigger value="without">Sin Cotización</TabsTrigger>
        </TabsList>

        <TabsContent value="with" className="mt-0">
          <Card className="border">
            <CardHeader className="border-b bg-muted/40 py-4">
              <CardTitle className="text-base font-medium">
                Crear con Cotización
              </CardTitle>
              <CardDescription className="text-sm">
                Seleccione una cotización existente para continuar
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <WorkOrderWithQuotation preselectedVehicleId={vehicleIdFromUrl ? Number(vehicleIdFromUrl) : undefined} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="without" className="mt-0">
          <Card className="border">
            <CardHeader className="border-b bg-muted/40 py-4">
              <CardTitle className="text-base font-medium">
                Crear sin Cotización
              </CardTitle>
              <CardDescription className="text-sm">
                Configure manualmente los productos y servicios
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <WorkOrderWithoutQuotation preselectedVehicleId={vehicleIdFromUrl ? Number(vehicleIdFromUrl) : undefined} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default WorkOrderCreatePage;
