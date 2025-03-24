import { ColumnDef } from "@tanstack/react-table";
import type { WorkOrder } from "@/types/interfaces";
import { formatDate } from "@/utils/formDate"; // Si tienes esta utilidad

export const workOrderColumns: ColumnDef<WorkOrder>[] = [
  {
    id: "work_order_id",
    header: "ID",
    accessorKey: "work_order_id",
  },
  {
    id: "description",
    header: "Descripción",
    accessorKey: "description",
  },
  {
    id: "work_order_status",
    header: "Estado",
    accessorKey: "work_order_status",
  },
  {
    id: "entry_date",
    header: "Fecha de Entrada",
    accessorKey: "entry_date",
    cell: ({ getValue }) => {
      const date = new Date(getValue() as string);
      return formatDate ? formatDate(date) : date.toLocaleDateString();
    },
  },
  {
    id: "has_quotation",
    header: "Con Cotización",
    cell: ({ row }) => {
      const workOrder = row.original;
      return workOrder.quotation ? "Sí" : "No";
    },
  },
  {
    id: "actions",
    header: "Acciones",
    cell: ({ row }) => {
      const workOrder = row.original;
      return (
        <div className="flex gap-2">
          <button
            className="btn btn-outline btn-sm"
            onClick={() => {
              // Aquí deberías llamar al callback onEdit que recibas en props,
              // por ejemplo: onEdit(workOrder)
              console.log("Editar", workOrder);
            }}
          >
            Editar
          </button>
          <button
            className="btn btn-destructive btn-sm"
            onClick={() => {
              // Similar para el callback onDelete
              console.log("Eliminar", workOrder.work_order_id);
            }}
          >
            Eliminar
          </button>
        </div>
      );
    },
  },
];
