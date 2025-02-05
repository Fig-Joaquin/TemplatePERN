import { Router } from "express";
import authRoutes from "./authRoutes";
import personsRoutes from "./personsRoutes";
import userRoutes from "./userRoutes";
import vehicleRoutes from "./vehicleRoutes";
import vehicleModelRoutes from "./vehicleModelRoutes";
import vehicleBrandRoutes from "./vehicleBrandRoutes";
import mileageHistoryRoutes from "./mileageHistoryRoutes";

const router = Router();


router.use("/auth", authRoutes);
router.use("/persons", personsRoutes);
router.use("/user", userRoutes);
router.use("/vehicles", vehicleRoutes);
router.use("/vehicleModels", vehicleModelRoutes);
router.use("/vehicleBrands", vehicleBrandRoutes);
router.use("/mileageHistories", mileageHistoryRoutes);


export default router;
