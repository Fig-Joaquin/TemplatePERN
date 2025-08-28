import { useState, } from "react";
import { useLocation } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import WorkOrderWithQuotation from "@/components/workOrders/WorkOrderWithQuotation";
import WorkOrderWithoutQuotation from "@/components/workOrders/WorkOrderWithoutQuotation";
import { motion } from "framer-motion";

const WorkOrderCreatePage = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const vehicleIdFromUrl = queryParams.get('vehicleId');
  const withoutQuotation = queryParams.get('withoutQuotation') === 'true';
  
  const [activeTab, setActiveTab] = useState(withoutQuotation ? "without" : "with");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto p-6"
    >
      <h1 className="text-3xl font-bold mb-6">Crear Orden de Trabajo</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger className={activeTab === "with" ? "bg-primary text-destructive-foreground font-bold scale-105 shadow-md" : ""} value="with">Con Cotización</TabsTrigger>
          <TabsTrigger className={activeTab === "without" ? "bg-primary text-destructive-foreground font-bold scale-105 shadow-md" : ""} value="without">Sin Cotización</TabsTrigger>
        </TabsList>
        
        <TabsContent value="with">
          <WorkOrderWithQuotation preselectedVehicleId={vehicleIdFromUrl ? Number(vehicleIdFromUrl) : undefined} />
        </TabsContent>
        
        <TabsContent value="without">
          <WorkOrderWithoutQuotation preselectedVehicleId={vehicleIdFromUrl ? Number(vehicleIdFromUrl) : undefined} />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default WorkOrderCreatePage;
