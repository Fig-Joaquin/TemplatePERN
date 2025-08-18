import { Router } from "express";
import {
    getAllExpenseTypes,
    getExpenseTypeById,
    createExpenseType,
    updateExpenseType,
    deleteExpenseType
} from "../controllers/expenseTypeController";

const router = Router();

// Get all expense types
router.get("/", getAllExpenseTypes);

// Get an expense type by ID
router.get("/:id", getExpenseTypeById);

// Create a new expense type
router.post("/", createExpenseType);

// Update an existing expense type
router.put("/:id", updateExpenseType);

// Delete an expense type
router.delete("/:id", deleteExpenseType);

export default router;