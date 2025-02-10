import { Router } from "express";
import { 

getAllProductCategories, 
getProductCategoryById, 
createProductCategory, 
updateProductCategory, 
deleteProductCategory 
} from "../controllers/products/productCategoryController";

const router = Router();

router.get("/", getAllProductCategories);
router.get("/:id", getProductCategoryById);
router.post("/", createProductCategory);
router.put("/:id", updateProductCategory);
router.delete("/:id", deleteProductCategory);

export default router;