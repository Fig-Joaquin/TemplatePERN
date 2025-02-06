import { Router } from "express";
import authRoutes from "./authRoutes";
import personsRoutes from "./personsRoutes";
import userRoutes from "./userRoutes";
import vehicleRoutes from "./vehicleRoutes";
import vehicleModelRoutes from "./vehicleModelRoutes";
import vehicleBrandRoutes from "./vehicleBrandRoutes";
import mileageHistoryRoutes from "./mileageHistoryRoutes";
import productCategoryRoutes from "./productCategoryRoutes"; 
import productRoutes from "./productRoutes";
import productTypeRoutes from "./productTypeRoutes";
import quotationRoutes from "./quotationRoutes";
import taxRoutes from "./taxRoutes";
import workOrderRoutes from "./workOrderRoutes";
import  WorkProductDetail  from "./workProductDetailRoutes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/persons", personsRoutes);
router.use("/user", userRoutes);
router.use("/vehicles", vehicleRoutes);
router.use("/vehicleModels", vehicleModelRoutes);
router.use("/vehicleBrands", vehicleBrandRoutes);
router.use("/mileageHistories", mileageHistoryRoutes);
router.use("/productCategories", productCategoryRoutes); 
router.use("/products", productRoutes);
router.use("/productTypes", productTypeRoutes);
router.use("/quotations", quotationRoutes);
router.use("/taxes", taxRoutes);
router.use("/workOrders", workOrderRoutes);
router.use("/workProductDetails", WorkProductDetail);

export default router;