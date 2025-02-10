import { Router } from "express";
import {

getAllCompanies,
getCompanyById,
createCompany,
updateCompany,
deleteCompany
} from "../controllers/companiesController";

const router = Router();

router.get("/", getAllCompanies);          // Obtiene todas las empresas
router.get("/:id", getCompanyById);         // Obtiene una empresa por ID
router.post("/", createCompany);            // Crea una nueva empresa
router.put("/:id", updateCompany);          // Actualiza una empresa existente
router.delete("/:id", deleteCompany);       // Elimina una empresa

export default router;