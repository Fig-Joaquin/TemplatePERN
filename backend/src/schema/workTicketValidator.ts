import { z } from "zod";

export const WorkTicketSchema = z.object({
    work_ticket_id: z.number().optional(), // Optional since it's auto-generated
    work_order_id: z.number(),
    description: z.string().min(10, {
        message: "La descripción debe tener al menos 10 caracteres"
    }).max(1000, {
        message: "La descripción no puede exceder los 1000 caracteres"
    }),
    ticket_status: z.string().max(50, {
        message: "El estado del ticket no puede exceder los 50 caracteres"
    }),
    ticket_date: z.coerce.date()
});

export type WorkTicketInput = z.infer<typeof WorkTicketSchema>;