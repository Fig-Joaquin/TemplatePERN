// src/controllers/workOrderTechnicianController.ts
import { Request, Response, NextFunction } from "express";
import { DeepPartial } from "typeorm";
import { AppDataSource } from "../../config/ormconfig";
import { WorkOrderTechnician } from "../../entities/work/workOrderTechnician";
import { UpdateWorkOrderTechnicianSchema, WorkOrderTechnicianSchema } from "../../schema/work/workOrderTechnicianSchema";
import { Person } from "../../entities/personsEntity";

const workOrderTechnicianRepository = AppDataSource.getRepository(WorkOrderTechnician);

export const getAllWorkOrderTechnicians = async (_req: Request, res: Response, _next: NextFunction): Promise<void> => {
  try {
    const workOrderTechnicians = await workOrderTechnicianRepository.find({
      relations: ["workOrder", "technician"]
    });
    res.json(workOrderTechnicians);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener las asignaciones de técnicos", error });
  }
};

export const getWorkOrderTechnicianById = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const workOrderTechnician = await workOrderTechnicianRepository.findOne({
      where: { id: parseInt(id) },
      relations: ["workOrder", "technician"]
    });
    if (!workOrderTechnician) {
      res.status(404).json({ message: "Asignación de técnico no encontrada" });
      return;
    }
    res.json(workOrderTechnician);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener la asignación de técnico", error });
  }
};

export const createWorkOrderTechnician = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      // Validar la entrada con Zod
      const validationResult = WorkOrderTechnicianSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(400).json({
          message: "Error de validación",
          errors: validationResult.error.errors.map(err => ({
            field: err.path.join("."),
            message: err.message
          }))
        });
        return;
      }
  
      // Extraer los IDs planos y el resto de datos
      const { work_order_id, technician_id, ...rest } = validationResult.data;
  
      // (Opcional) Verificar que la persona tenga el rol "trabajador"
      const personRepository = AppDataSource.getRepository(Person);
      const technicianEntity = await personRepository.findOneBy({ person_id: technician_id });
      if (!technicianEntity || technicianEntity.person_type !== "trabajador") {
        res.status(400).json({ message: "La persona seleccionada no tiene rol de trabajador" });
        return;
      }
  
      // Transformar los campos de IDs en relaciones para TypeORM usando los nombres correctos
      const data: DeepPartial<WorkOrderTechnician> = {
        ...rest,
        workOrder: { work_order_id: work_order_id } as DeepPartial<WorkOrderTechnician["workOrder"]>,
        technician: { person_id: technician_id } as DeepPartial<WorkOrderTechnician["technician"]>
      };
  
      const workOrderTechnician = workOrderTechnicianRepository.create(data);
      await workOrderTechnicianRepository.save(workOrderTechnician);
      res.status(201).json({ message: "Asignación de técnico creada exitosamente", workOrderTechnician });
    } catch (error: unknown) {
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') {
        res.status(409).json({ message: "La asignación ya existe", error });
        return;
      }
      console.error("Error al crear la asignación de técnico:", error);
      res.status(500).json({ 
        message: "Error interno al crear la asignación de técnico",
        error: error instanceof Error ? error.message : error
      });
    }
  };
  

export const updateWorkOrderTechnician = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const workOrderTechnician = await workOrderTechnicianRepository.findOneBy({ id: parseInt(id) });
    
    if (!workOrderTechnician) {
      res.status(404).json({ message: "Asignación de técnico no encontrada" });
      return;
    }

    const validationResult = UpdateWorkOrderTechnicianSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({ errors: validationResult.error.errors });
      return;
    }

    // Extraer y transformar si existen campos de relaciones
    const { work_order_id, technician_id, ...rest } = validationResult.data;
    const updateData: DeepPartial<WorkOrderTechnician> = { ...rest };

    if (work_order_id !== undefined) {
      updateData.workOrder = { id: work_order_id } as DeepPartial<WorkOrderTechnician["workOrder"]>;
    }
    if (technician_id !== undefined) {
      updateData.technician = { id: technician_id } as DeepPartial<WorkOrderTechnician["technician"]>;
    }

    workOrderTechnicianRepository.merge(workOrderTechnician, updateData);
    await workOrderTechnicianRepository.save(workOrderTechnician);
    res.json(workOrderTechnician);
  } catch (error: unknown) {
    res.status(500).json({ message: "Error al actualizar la asignación de técnico", error });
  }
};

export const deleteWorkOrderTechnician = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await workOrderTechnicianRepository.delete(parseInt(id));
    
    if (result.affected === 0) {
      res.status(404).json({ message: "Asignación de técnico no encontrada" });
      return;
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar la asignación de técnico", error });
  }
};
