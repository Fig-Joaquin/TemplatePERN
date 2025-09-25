import { Request, Response, NextFunction } from "express";
import { AppDataSource } from "../config/ormconfig";
import { ExpenseType } from "../entities/tipoGasto";
import { CompanyExpense } from "../entities/gastosEmpresas";
import { CompanyExpenseSchema, UpdateCompanyExpenseSchema } from "../schema/work/companyExpenseValidator";
import { DeepPartial } from "typeorm";
import type { ZodIssue } from "zod";

const companyExpenseRepository = AppDataSource.getRepository(CompanyExpense);
const expenseTypeRepository = AppDataSource.getRepository(ExpenseType);

export const getAllCompanyExpenses = async (_req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const expenses = await companyExpenseRepository.find({ 
            relations: ["expense_type"] 
        });
        res.json(expenses);
    } catch (error) {
        res.status(500).json({ message: "Error retrieving company expenses", error });
    }
};

export const getCompanyExpenseById = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ message: "Invalid ID" });
            return;
        }

        const expense = await companyExpenseRepository.findOne({
            where: { company_expense_id: id },
            relations: ["expense_type"]
        });
        
        if (!expense) {
            res.status(404).json({ message: "Company expense not found" });
            return;
        }

        res.json(expense);
    } catch (error) {
        res.status(500).json({ message: "Error retrieving company expense", error });
    }
};

export const createCompanyExpense = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const validationResult = CompanyExpenseSchema.safeParse(req.body);
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

        const { expense_type_id, ...rest } = validationResult.data;
        
        // Verify that the expense type exists
        const expenseType = await expenseTypeRepository.findOneBy({ expense_type_id: expense_type_id as number });
        if (!expenseType) {
            res.status(404).json({ message: "Expense type not found" });
            return;
        }

        const newExpense = companyExpenseRepository.create({
            ...rest,
            expense_type: expenseType
        } as DeepPartial<CompanyExpense>);
        
        await companyExpenseRepository.save(newExpense);
        
        res.status(201).json({ message: "Company expense created successfully", expense: newExpense });
    } catch (error) {
        res.status(500).json({ message: "Error creating company expense", error });
    }
};

export const updateCompanyExpense = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ message: "Invalid ID" });
            return;
        }

        const expense = await companyExpenseRepository.findOne({
            where: { company_expense_id: id },
            relations: ["expense_type"]
        });
        
        if (!expense) {
            res.status(404).json({ message: "Company expense not found" });
            return;
        }

        const validationResult = UpdateCompanyExpenseSchema.safeParse(req.body);
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

        const { expense_type_id, ...rest } = validationResult.data;

        // If an expense type is provided, verify it exists
        if (expense_type_id !== undefined) {
            const expenseType = await expenseTypeRepository.findOneBy({ expense_type_id: expense_type_id as number });
            if (!expenseType) {
                res.status(404).json({ message: "Expense type not found" });
                return;
            }
            expense.expense_type = expenseType;
        }

        companyExpenseRepository.merge(expense, rest as DeepPartial<CompanyExpense>);
        await companyExpenseRepository.save(expense);
        
        res.json({ message: "Company expense updated successfully", expense });
    } catch (error) {
        res.status(500).json({ message: "Error updating company expense", error });
    }
};

export const deleteCompanyExpense = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ message: "Invalid ID" });
            return;
        }

        const result = await companyExpenseRepository.delete(id);
        if (result.affected === 0) {
            res.status(404).json({ message: "Company expense not found" });
            return;
        }

        res.json({ message: "Company expense deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting company expense", error });
    }
};