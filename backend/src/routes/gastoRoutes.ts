import { Router } from "express";
import {
    getAllCompanyExpenses,
    getCompanyExpenseById,
    createCompanyExpense,
    updateCompanyExpense,
    deleteCompanyExpense
} from "../controllers/gastoController";

const router = Router();

// Get all company expenses
router.get("/", getAllCompanyExpenses);

// Get a company expense by ID
router.get("/:id", getCompanyExpenseById);

// Create a new company expense
router.post("/", createCompanyExpense);

// Update an existing company expense
router.put("/:id", updateCompanyExpense);

// Delete a company expense
router.delete("/:id", deleteCompanyExpense);

export default router;