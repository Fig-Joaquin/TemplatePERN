import { z } from "zod";
import { ExpenseTypeSchema } from "./expenseTypeValidator";

export const CompanyExpenseSchema = z.object({
    company_expense_id: z.number().int().positive().optional(), // Optional because it's auto-generated
    expense_type_id: z.number().int().positive(),
    expense_type: ExpenseTypeSchema.optional(),
    description: z.string().min(1, { message: "Description cannot be empty" }),
    amount: z.number()
        .min(0, { message: "Amount cannot be negative" })
        .multipleOf(0.01),
    expense_date: z.coerce.date(),
    receipt_number: z.string().max(50).optional()
});

export const UpdateCompanyExpenseSchema = CompanyExpenseSchema.partial();

export type CompanyExpenseInput = z.infer<typeof CompanyExpenseSchema>;
export type UpdateCompanyExpenseInput = z.infer<typeof UpdateCompanyExpenseSchema>;
