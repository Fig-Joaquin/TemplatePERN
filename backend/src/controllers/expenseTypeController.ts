import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../config/ormconfig";
import { ExpenseType } from "../entities/tipoGasto";
import { ExpenseTypeSchema } from "../schema/work/expenseTypeValidator";
import type { ZodIssue } from "zod";

const expenseTypeRepository = AppDataSource.getRepository(ExpenseType);

export const getAllExpenseTypes = async (_req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const expenseTypes = await expenseTypeRepository.find();
        res.json(expenseTypes);
    } catch (error) {
        res.status(500).json({ message: "Error retrieving expense types", error });
    }
};

export const getExpenseTypeById = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ message: "Invalid ID" });
            return;
        }

        const expenseType = await expenseTypeRepository.findOneBy({ expense_type_id: id });
        if (!expenseType) {
            res.status(404).json({ message: "Expense type not found" });
            return;
        }

        res.json(expenseType);
    } catch (error) {
        res.status(500).json({ message: "Error retrieving expense type", error });
    }
};

export const createExpenseType = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const validationResult = ExpenseTypeSchema.safeParse(req.body);
        if (!validationResult.success) {
            res.status(400).json({
                message: "Validation error",
                errors: validationResult.error.errors.map((err: ZodIssue) => ({
                    field: err.path.join("."),
                    message: err.message
                }))
            });
            return;
        }

        const { expense_type_name } = validationResult.data;
        
        // Check if an expense type with the same name already exists
        const existingExpenseType = await expenseTypeRepository.findOneBy({ expense_type_name: expense_type_name as string });
        if (existingExpenseType) {
            res.status(409).json({ message: `Expense type '${expense_type_name}' already exists.` });
            return;
        }

        const newExpenseType = expenseTypeRepository.create(validationResult.data);
        await expenseTypeRepository.save(newExpenseType);
        
        res.status(201).json({ message: "Expense type created successfully", expenseType: newExpenseType });
    } catch (error) {
        res.status(500).json({ message: "Error creating expense type", error });
    }
};

export const updateExpenseType = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ message: "Invalid ID" });
            return;
        }

        const expenseType = await expenseTypeRepository.findOneBy({ expense_type_id: id });
        if (!expenseType) {
            res.status(404).json({ message: "Expense type not found" });
            return;
        }

        const validationResult = ExpenseTypeSchema.partial().safeParse(req.body);
        if (!validationResult.success) {
            res.status(400).json({
                message: "Validation error",
                errors: validationResult.error.errors.map((err: ZodIssue) => ({
                    field: err.path.join("."),
                    message: err.message
                }))
            });
            return;
        }

        // If updating the name, check that no other type exists with that name
        if (validationResult.data.expense_type_name && 
            validationResult.data.expense_type_name !== expenseType.expense_type_name) {
            const existingExpenseType = await expenseTypeRepository.findOneBy({ 
                expense_type_name: validationResult.data.expense_type_name 
            });
            if (existingExpenseType) {
                res.status(409).json({ 
                    message: `Expense type '${validationResult.data.expense_type_name}' already exists.` 
                });
                return;
            }
        }

        expenseTypeRepository.merge(expenseType, validationResult.data);
        await expenseTypeRepository.save(expenseType);
        
        res.json({ message: "Expense type updated successfully", expenseType });
    } catch (error) {
        res.status(500).json({ message: "Error updating expense type", error });
    }
};

export const deleteExpenseType = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ message: "Invalid ID" });
            return;
        }

        // Check if there are expenses associated with this type
        const expenseType = await expenseTypeRepository.findOne({
            where: { expense_type_id: id },
            relations: ["expenses"]
        });

        if (!expenseType) {
            res.status(404).json({ message: "Expense type not found" });
            return;
        }

        if (expenseType.expenses && expenseType.expenses.length > 0) {
            res.status(409).json({ 
                message: "Cannot delete this expense type because it has associated expenses" 
            });
            return;
        }

        const result = await expenseTypeRepository.delete(id);
        if (result.affected === 0) {
            res.status(404).json({ message: "Expense type not found" });
            return;
        }

        res.json({ message: "Expense type deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting expense type", error });
    }
};
