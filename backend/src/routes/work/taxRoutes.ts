import { Router } from "express";
import { 

getAllTaxes,
getActiveTax,
getTaxById,
createTax,
updateTax,
deleteTax
} from "../../controllers/work/taxController";

const router = Router();

router.get("/", getAllTaxes);
router.get("/active", getActiveTax); // Nuevo endpoint para obtener el impuesto activo
router.get("/:id", getTaxById);
router.post("/", createTax);
router.put("/:id", updateTax);
router.delete("/:id", deleteTax);

export default router;