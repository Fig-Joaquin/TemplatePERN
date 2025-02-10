import { Router } from "express";
import {

getAllWorkProductDetails,
getWorkProductDetailById,
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

export default router;