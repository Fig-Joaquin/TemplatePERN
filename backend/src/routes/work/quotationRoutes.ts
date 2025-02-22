import { Router } from "express";
import {

getAllQuotations,
getQuotationById,
createQuotation,
updateQuotation,
deleteQuotation,
} from "../../controllers/work/quotationController";

import { generateQuotationPDF } from "../../controllers/work/quotationPDFCreatorController";

const quotationRoutes = Router();

quotationRoutes.get("/", getAllQuotations);
quotationRoutes.get("/:id", getQuotationById);
quotationRoutes.post("/", createQuotation);
quotationRoutes.put("/:id", updateQuotation);
quotationRoutes.delete("/:id", deleteQuotation);
quotationRoutes.get("/pdf/:id", generateQuotationPDF);

export default quotationRoutes;