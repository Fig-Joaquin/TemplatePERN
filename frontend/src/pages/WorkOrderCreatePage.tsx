import { useState } from "react";
import { Button } from "@/components/ui/button";
import WorkOrderWithQuotation from "@/components/workOrders/WorkOrderWithQuotation";
import WorkOrderWithoutQuotation from "@/components/workOrders/WorkOrderWithoutQuotation";

const WorkOrderCreatePage = () => {
  const [selectedFlow, setSelectedFlow] = useState<"withQuotation" | "withoutQuotation" | null>(null);

  if (!selectedFlow) {
    return (
      <div className="container mx-auto p-6 flex flex-col items-center">
        <h2 className="text-2xl font-bold mb-4">Selecciona el tipo de orden de trabajo</h2>
        <div className="space-x-4">
          <Button onClick={() => setSelectedFlow("withQuotation")}>Con Cotización</Button>
          <Button onClick={() => setSelectedFlow("withoutQuotation")}>Sin Cotización</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {selectedFlow === "withQuotation" ? (
        <WorkOrderWithQuotation />
      ) : (
        <WorkOrderWithoutQuotation />
      )}
    </>
  );
};

export default WorkOrderCreatePage;
