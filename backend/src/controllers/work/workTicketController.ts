/* eslint-disable no-console */
import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../../config/ormconfig";
import { WorkTicket, WorkOrder } from "../../entities";
import { DeepPartial } from "typeorm";
import { z } from "zod";

const workTicketRepository = AppDataSource.getRepository(WorkTicket);
const workOrderRepository = AppDataSource.getRepository(WorkOrder);

// Zod schema for work ticket validation
const WorkTicketSchema = z.object({
    work_order_id: z.number().int().positive(),
    description: z.string().min(10, { message: "La descripción debe tener al menos 10 caracteres" })
        .max(1000, { message: "La descripción no puede exceder los 1000 caracteres" }),
    ticket_status: z.string().max(50, { message: "El estado no puede exceder los 50 caracteres" }),
    ticket_date: z.string().or(z.date()).optional()
});

export const getAllWorkTickets = async (_req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const tickets = await workTicketRepository.find({
            relations: ["work_order", "work_order.vehicle", "work_order.vehicle.owner", "work_order.vehicle.company"]
        });
        res.json(tickets);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener los tickets de trabajo", error });
    }
};

export const getWorkTicketById = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ message: "ID inválido" });
            return;
        }

        const ticket = await workTicketRepository.findOne({
            where: { work_ticket_id: id },
            relations: ["work_order", "work_order.vehicle", "work_order.vehicle.owner", "work_order.vehicle.company"]
        });

        if (!ticket) {
            res.status(404).json({ message: "Ticket de trabajo no encontrado" });
            return;
        }

        res.json(ticket);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener el ticket de trabajo", error });
    }
};

export const getWorkTicketsByWorkOrderId = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const workOrderId = parseInt(req.params.workOrderId);
        if (isNaN(workOrderId)) {
            res.status(400).json({ message: "ID de orden de trabajo inválido" });
            return;
        }

        const tickets = await workTicketRepository.find({
            where: { work_order: { work_order_id: workOrderId } },
            relations: ["work_order", "work_order.vehicle", "work_order.vehicle.owner", "work_order.vehicle.company"]
        });

        res.json(tickets);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener los tickets por orden de trabajo", error });
    }
};

export const createWorkTicket = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const validationResult = WorkTicketSchema.safeParse(req.body);
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

        const { work_order_id, ...ticketData } = validationResult.data;

        // Verificar que la orden de trabajo exista
        const workOrder = await workOrderRepository.findOneBy({ work_order_id });
        if (!workOrder) {
            res.status(404).json({ message: "Orden de trabajo no encontrada" });
            return;
        }

        const newTicket = workTicketRepository.create({
            ...ticketData,
            work_order: workOrder,
            ticket_date: new Date()
        } as DeepPartial<WorkTicket>);

        await workTicketRepository.save(newTicket);

        const savedTicket = await workTicketRepository.findOne({
            where: { work_ticket_id: newTicket.work_ticket_id },
            relations: ["work_order", "work_order.vehicle", "work_order.vehicle.owner", "work_order.vehicle.company"]
        });

        res.status(201).json({ message: "Ticket de trabajo creado exitosamente", workTicket: savedTicket });
    } catch (error) {
        console.error("Error al crear el ticket de trabajo:", error);
        res.status(500).json({ message: "Error al crear el ticket de trabajo", error });
    }
};

export const updateWorkTicket = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ message: "ID inválido" });
            return;
        }

        const ticket = await workTicketRepository.findOneBy({ work_ticket_id: id });
        if (!ticket) {
            res.status(404).json({ message: "Ticket de trabajo no encontrado" });
            return;
        }

        const updateSchema = WorkTicketSchema.partial();
        const validationResult = updateSchema.safeParse(req.body);
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

        workTicketRepository.merge(ticket, validationResult.data as DeepPartial<WorkTicket>);
        await workTicketRepository.save(ticket);

        const updatedTicket = await workTicketRepository.findOne({
            where: { work_ticket_id: id },
            relations: ["work_order", "work_order.vehicle", "work_order.vehicle.owner", "work_order.vehicle.company"]
        });

        res.json({ message: "Ticket de trabajo actualizado exitosamente", workTicket: updatedTicket });
    } catch (error) {
        console.error("Error al actualizar el ticket de trabajo:", error);
        res.status(500).json({ message: "Error al actualizar el ticket de trabajo", error });
    }
};

export const deleteWorkTicket = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ message: "ID inválido" });
            return;
        }

        const result = await workTicketRepository.delete(id);
        if (result.affected === 0) {
            res.status(404).json({ message: "Ticket de trabajo no encontrado" });
            return;
        }

        res.json({ message: "Ticket de trabajo eliminado exitosamente" });
    } catch (error) {
        console.error("Error al eliminar el ticket de trabajo:", error);
        res.status(500).json({ message: "Error al eliminar el ticket de trabajo", error });
    }
};
