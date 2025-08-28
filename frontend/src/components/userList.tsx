// src/components/userList.tsx
import React from "react";
import { Edit, Trash2, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { User } from "../types/interfaces";

interface UserListProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (userId: number) => void;
}

const UserList: React.FC<UserListProps> = ({ users, onEdit, onDelete }) => {
  if (users.length === 0) {
    return (
      <div className="text-center py-8">
        <UserIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500">No hay usuarios registrados</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre Completo</TableHead>
            <TableHead>RUT</TableHead>
            <TableHead>Nombre de Usuario</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead className="text-center">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.user_id}>
              <TableCell className="font-medium">
                {user.person ? `${user.person.name} ${user.person.first_surname}` : "Sin información"}
              </TableCell>
              <TableCell>
                {user.person?.rut || "Sin RUT"}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-gray-500" />
                  {user.username}
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  variant="destructive"
                  className="flex items-center gap-1 w-fit"
                >
                  <UserIcon className="w-3 h-3" />
                  Administrador
                </Badge>
              </TableCell>
              <TableCell>
                {user.person?.email || "Sin email"}
              </TableCell>
              <TableCell>
                {user.person?.number_phone ? `+${user.person.number_phone}` : "Sin teléfono"}
              </TableCell>
              <TableCell className="text-center">
                <div className="flex justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(user)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onDelete(user.user_id)}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default UserList;
