import { Router } from "express";
import { 

getAllTaxes,
getTaxById,
createTax,
updateTax,
deleteTax
} from "../../controllers/work/taxController";

const router = Router();

router.get("/", getAllTaxes);
router.get("/:id", getTaxById);
router.post("/", createTax);
router.put("/:id", updateTax);
router.delete("/:id", deleteTax);

export default router;