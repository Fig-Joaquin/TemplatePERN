import { Router } from "express";
import {
getAllCompanies,
getCompanyById,
createCompany,
updateCompany,
deleteCompany
} from "../../controllers/work/companiesController";
import { requireAdmin, authenticateUser } from "../../middleware/authMiddleware";

const router = Router();

router.get("/", authenticateUser, getAllCompanies);          // Obtiene todas las empresas (requiere autenticación)
router.get("/:id", authenticateUser, getCompanyById);       // Obtiene una empresa por ID (requiere autenticación)
router.post("/", requireAdmin, createCompany);              // Crea una nueva empresa (solo administradores)
router.put("/:id", requireAdmin, updateCompany);            // Actualiza una empresa existente (solo administradores)
router.delete("/:id", requireAdmin, deleteCompany);         // Elimina una empresa (solo administradores)

export default router;