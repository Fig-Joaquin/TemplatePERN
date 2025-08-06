import { Router } from "express";
import {

getAllWorkProductDetails,
getWorkProductDetailById,
getWorkProductDetailsByQuotationId,
getWorkProductDetailsByWorkOrderId,
createWorkProductDetail,
updateWorkProductDetail,
deleteWorkProductDetail,
} from "../../controllers/work/workProductDetailController";

const router = Router();

router.get("/", getAllWorkProductDetails);
router.get("/:id", getWorkProductDetailById);
router.post("/", createWorkProductDetail);
router.put("/:id", updateWorkProductDetail);
router.delete("/:id", deleteWorkProductDetail);
router.get("/quotation/:quotationId", getWorkProductDetailsByQuotationId);
router.get("/workorder/:workOrderId", getWorkProductDetailsByWorkOrderId);

export default router;