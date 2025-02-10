import { Router } from "express";
import { getAllDebtors, getDebtorById, createDebtor, updateDebtor, deleteDebtor } from "../controllers/work/debtorsController";

// src/routes/debtorRoutes.ts

const router = Router();

router.get("/", getAllDebtors);
router.get("/:id", getDebtorById);
router.post("/", createDebtor);
router.put("/:id", updateDebtor);
router.delete("/:id", deleteDebtor);

export default router;