import { useState } from "react";
import { Button } from "@/components/ui/button";
import WorkOrderWithQuotation from "@/components/workOrders/WorkOrderWithQuotation";
import WorkOrderWithoutQuotation from "@/components/workOrders/WorkOrderWithoutQuotation";
import { motion } from "framer-motion";

const WorkOrderCreatePage = () => {
  const [selectedFlow, setSelectedFlow] = useState<"withQuotation" | "withoutQuotation" | null>(null);

  if (!selectedFlow) {
    return (
      <motion.div 
        className="container mx-auto p-6 flex flex-col items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-2xl font-bold mb-4">Selecciona el tipo de orden de trabajo</h2>
        <motion.div 
          className="space-x-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Button onClick={() => setSelectedFlow("withQuotation")}>Con Cotización</Button>
          <Button onClick={() => setSelectedFlow("withoutQuotation")}>Sin Cotización</Button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {selectedFlow === "withQuotation" ? (
        <WorkOrderWithQuotation />
      ) : (
        <WorkOrderWithoutQuotation />
      )}
    </motion.div>
  );
};

export default WorkOrderCreatePage;
