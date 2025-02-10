import { Router } from "express";
import {

getAllQuotations,
getQuotationById,
createQuotation,
updateQuotation,
deleteQuotation,
} from "../../controllers/work/quotationController";

const quotationRoutes = Router();

quotationRoutes.get("/", getAllQuotations);
quotationRoutes.get("/:id", getQuotationById);
quotationRoutes.post("/", createQuotation);
quotationRoutes.put("/:id", updateQuotation);
quotationRoutes.delete("/:id", deleteQuotation);

export default quotationRoutes;