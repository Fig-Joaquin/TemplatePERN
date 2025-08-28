"use client"

import React from "react"
import { Edit, Trash2 } from "lucide-react"
import type { Supplier } from "../types/interfaces"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface SupplierListProps {
  suppliers: Supplier[]
  handleEdit: (supplier: Supplier) => void
  handleDelete: (supplierId: number) => void
}

const SupplierList: React.FC<SupplierListProps> = ({
  suppliers,
  handleEdit,
  handleDelete,
}) => {
  return (
    <div className="overflow-x-auto">
      {suppliers.length === 0 ? (
        <p>No hay información disponible.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Dirección</TableHead>
              <TableHead>Ciudad</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead className="text-center">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {suppliers.map((supplier) => (
              <TableRow key={supplier.supplier_id}>
                <TableCell className="font-medium">{supplier.name}</TableCell>
                <TableCell>{supplier.address || "No especificada"}</TableCell>
                <TableCell>{supplier.city || "No especificada"}</TableCell>
                <TableCell>+{supplier.phone}</TableCell>
                <TableCell>
                  {supplier.description ? (
                    <span className="text-sm text-gray-600 line-clamp-2">
                      {supplier.description}
                    </span>
                  ) : (
                    "Sin descripción"
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex justify-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(supplier)}>
                      <Edit className="w-4 h-4" />
                      <span className="hidden sm:inline ml-1">Editar</span>
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(supplier.supplier_id)}>
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline ml-1">Eliminar</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}

export default SupplierList
