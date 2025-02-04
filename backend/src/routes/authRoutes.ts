// src/routes/authRoutes.ts
import { Router } from "express";
import { login, logoutUser } from "../controllers/authController";
// import { authenticateUser } from "../middleware/authMiddleware";

const authRoutes = Router();

authRoutes.post("/login", login);
authRoutes.post("/logout", logoutUser);
// router.get("/perfil", authenticateUser, (req, res) => {
//   res.json({ message: "Acceso autorizado", user: req.user });
// });

export default authRoutes;
