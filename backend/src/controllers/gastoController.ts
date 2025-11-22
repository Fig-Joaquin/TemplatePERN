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
        res.status(500).json({ message: "Error al obtener los gastos de empresa", error });
    }
};

export const getCompanyExpenseById = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ message: "ID inválido" });
            return;
        }

        const expense = await companyExpenseRepository.findOne({
            where: { company_expense_id: id },
            relations: ["expense_type"]
        });
        
        if (!expense) {
            res.status(404).json({ message: "Gasto de empresa no encontrado" });
            return;
        }

        res.json(expense);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener el gasto de empresa", error });
    }
};

export const createCompanyExpense = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const validationResult = CompanyExpenseSchema.safeParse(req.body);
        if (!validationResult.success) {
            res.status(400).json({
                message: "Error de validación",
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
            res.status(404).json({ message: "Tipo de gasto no encontrado" });
            return;
        }

        const newExpense = companyExpenseRepository.create({
            ...rest,
            expense_type: expenseType
        } as DeepPartial<CompanyExpense>);
        
        await companyExpenseRepository.save(newExpense);
        
        res.status(201).json({ message: "Gasto de empresa creado exitosamente", expense: newExpense });
    } catch (error) {
        res.status(500).json({ message: "Error al crear el gasto de empresa", error });
    }
};

export const updateCompanyExpense = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ message: "ID inválido" });
            return;
        }

        const expense = await companyExpenseRepository.findOne({
            where: { company_expense_id: id },
            relations: ["expense_type"]
        });
        
        if (!expense) {
            res.status(404).json({ message: "Gasto de empresa no encontrado" });
            return;
        }

        const validationResult = UpdateCompanyExpenseSchema.safeParse(req.body);
        if (!validationResult.success) {
            res.status(400).json({
                message: "Error de validación",
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
                res.status(404).json({ message: "Tipo de gasto no encontrado" });
                return;
            }
            expense.expense_type = expenseType;
        }

        companyExpenseRepository.merge(expense, rest as DeepPartial<CompanyExpense>);
        await companyExpenseRepository.save(expense);
        
        res.json({ message: "Gasto de empresa actualizado exitosamente", expense });
    } catch (error) {
        res.status(500).json({ message: "Error al actualizar el gasto de empresa", error });
    }
};

export const deleteCompanyExpense = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ message: "ID inválido" });
            return;
        }

        const result = await companyExpenseRepository.delete(id);
        if (result.affected === 0) {
            res.status(404).json({ message: "Gasto de empresa no encontrado" });
            return;
        }

        res.json({ message: "Gasto de empresa eliminado exitosamente" });
    } catch (error) {
        res.status(500).json({ message: "Error al eliminar el gasto de empresa", error });
    }
};