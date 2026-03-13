import { Router } from "express";
import authRoutes from "./authRoutes";
import personsRoutes from "./personsRoutes";
import userRoutes from "./userRoutes";
import vehicleRoutes from "./vehicles/vehicleRoutes";
import vehicleModelRoutes from "./vehicles/vehicleModelRoutes";
import vehicleBrandRoutes from "./vehicles/vehicleBrandRoutes";
import mileageHistoryRoutes from "./vehicles/mileageHistoryRoutes";
import productCategoryRoutes from "./products/productCategoryRoutes"; 
import productRoutes from "./products/productRoutes";
import productTypeRoutes from "./products/productTypeRoutes";
import productPurchaseRoutes from "./products/productPurchaseRoutes";
import quotationRoutes from "./work/quotationRoutes";
import taxRoutes from "./work/taxRoutes";
import workOrderRoutes from "./work/workOrderRoutes";
import  WorkProductDetail  from "./work/workProductDetailRoutes";
import { debtorsRoutes } from "./work/debtorsRoutes";
import Supplier  from "./work/supliersRoutes";
import  StockProduct  from "./products/stock_productsController";
import Companies from "./work/companiesRoutes";
import chatbotRoute from "./chatbotRoutes";
import workOrderTechnicianRoutes from "./work/workOrderTechnician";
import notificationRoutes from "./notificationRoutes";
import gastoRoutes from "./gastoRoutes";
import tipoGastoRoutes from "./tipoGastoRoutes";
import paymentTypeRoutes from "./work/paymentTypeRoutes";
import workPaymentRoutes from "./work/workPaymentRoutes";
import { authenticateUser, AuthRequest } from "../middleware/authMiddleware";

const router = Router();

// ─── Public routes ───────────────────────────────────────────────────────────
// Only /auth endpoints (login, logout, check-session) are accessible without a
// valid session. Every route registered AFTER router.use(authenticateUser) is
// automatically protected.
router.use("/auth", authRoutes);

// ─── Authentication gate ─────────────────────────────────────────────────────
// Applies to all routes registered below this line.
router.use(authenticateUser);

router.use((req: AuthRequest, res, next) => {
	if (req.user?.userRole !== "contador") {
		next();
		return;
	}

	const allowedFinancePrefixes = [
		"/workPayments",
		"/company-expenses",
		"/debtors",
		"/paymentTypes",
		"/productPurchases",
	];

	const isAllowedFinanceRoute = allowedFinancePrefixes.some(
		(prefix) => req.path === prefix || req.path.startsWith(`${prefix}/`)
	);

	if (!isAllowedFinanceRoute) {
		res.status(403).json({
			message: "Acceso denegado. El rol contador solo puede acceder a módulos de finanzas.",
		});
		return;
	}

	if (req.method !== "GET") {
		res.status(403).json({
			message: "Acceso denegado. El rol contador solo tiene permisos de visualización.",
		});
		return;
	}

	next();
});

// ─── Protected routes ────────────────────────────────────────────────────────
router.use("/persons", personsRoutes);
router.use("/user", userRoutes);
router.use("/vehicles", vehicleRoutes);
router.use("/vehicleModels", vehicleModelRoutes);
router.use("/vehicleBrands", vehicleBrandRoutes);
router.use("/mileageHistories", mileageHistoryRoutes);
router.use("/productCategories", productCategoryRoutes); 
router.use("/products", productRoutes);
router.use("/productTypes", productTypeRoutes);
router.use("/productPurchases", productPurchaseRoutes);
router.use("/quotations", quotationRoutes);
router.use("/taxes", taxRoutes);
router.use("/workOrders", workOrderRoutes);
router.use("/workProductDetails", WorkProductDetail);
router.use("/debtors", debtorsRoutes);
router.use("/suppliers", Supplier);
router.use("/stockProducts", StockProduct);
router.use("/companies", Companies);
router.use("/chatbot", chatbotRoute);
router.use("/workOrderTechnicians", workOrderTechnicianRoutes);
router.use("/notifications", notificationRoutes);
router.use("/company-expenses", gastoRoutes);
router.use("/expense-types", tipoGastoRoutes);
router.use("/paymentTypes", paymentTypeRoutes);
router.use("/workPayments", workPaymentRoutes);

export default router;