import { z } from "zod";

export const ExpenseTypeSchema = z.object({
    expense_type_id: z.number().int().positive().optional(), // Optional because it's auto-generated
    expense_type_name: z.string()
        .min(2, { message: "Expense type name must have at least 2 characters" })
        .max(100, { message: "Expense type name cannot exceed 100 characters" }),
    description: z.string().optional()
});

export const UpdateExpenseTypeSchema = ExpenseTypeSchema.partial();

export type ExpenseTypeInput = z.infer<typeof ExpenseTypeSchema>;
export type UpdateExpenseTypeInput = z.infer<typeof UpdateExpenseTypeSchema>;
