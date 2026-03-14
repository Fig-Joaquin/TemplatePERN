import { Router } from "express";
import {
    addServiceToQuotation,
    getServicesByQuotation,
    updateQuotationService,
    deleteQuotationService,
} from "../../controllers/work/quotationServiceController";

// Nested routes: mounted at /quotations → /quotations/:id/services
export const quotationServiceNestedRoutes = Router();
quotationServiceNestedRoutes.post("/:id/services", addServiceToQuotation);
quotationServiceNestedRoutes.get("/:id/services", getServicesByQuotation);

// Detail routes: mounted at /quotation-services → /quotation-services/:id
export const quotationServiceDetailRoutes = Router();
quotationServiceDetailRoutes.put("/:id", updateQuotationService);
quotationServiceDetailRoutes.delete("/:id", deleteQuotationService);
