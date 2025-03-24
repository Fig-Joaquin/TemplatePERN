"use client";

import { motion } from "framer-motion";
import { DataTable } from "@/components/data-table";
import type { WorkOrder } from "@/types/interfaces";
import { workOrderColumns } from "./WorkOrderColumns";
import { FileText, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface WorkOrderListProps {
  workOrders: WorkOrder[];
  onEdit: (workOrder: WorkOrder) => void;
  onDelete: (workOrderId: number) => void;
}

const WorkOrderList = ({ workOrders, onEdit, onDelete }: WorkOrderListProps) => {
  // Mapear datos y añadir callbacks
  const data = workOrders.map((order) => ({
    ...order,
    onEdit: () => onEdit(order),
    onDelete: () => onDelete(order.work_order_id),
    hasQuotation: !!order.quotation || !!order.quotation_id,
  }));

  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-6">
      <motion.div
        className="space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
            <FileText className="w-8 h-8" />
            Órdenes de Trabajo
          </h1>
          <Button
            onClick={() => navigate("/admin/orden-trabajo/nuevo")}
            className="bg-primary text-primary-foreground"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva Orden
          </Button>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <DataTable
            columns={workOrderColumns}
            data={data}
          />
        </motion.div>
      </motion.div>
    </div>
  );
};

export default WorkOrderList;
