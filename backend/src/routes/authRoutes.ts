// src/routes/authRoutes.ts
import { Router } from "express";
import { login, logoutUser } from "../controllers/authController";
// import { authenticateUser } from "../middleware/authMiddleware";

const router = Router();

router.post("/login", login);
router.post("/logout", logoutUser);
// router.get("/perfil", authenticateUser, (req, res) => {
//   res.json({ message: "Acceso autorizado", user: req.user });
// });

export default router;
