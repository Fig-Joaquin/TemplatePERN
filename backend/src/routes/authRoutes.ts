// src/routes/authRoutes.ts
import { Router } from "express";
import { checkSession, login, logoutUser } from "../controllers/authController";
import { authenticateUser } from "../middleware/authMiddleware";
import { getProfile } from "../controllers/userController";
// import { authenticateUser } from "../middleware/authMiddleware";

const authRoutes = Router();

// ! Agregar authenticateUser como middleware en las rutas que requieran autenticación

authRoutes.post("/login", login);
authRoutes.post("/logout", logoutUser);
authRoutes.get("/check-session", checkSession);
authRoutes.get("/profile", authenticateUser, getProfile);

// router.get("/perfil", authenticateUser, (req, res) => {
//   res.json({ message: "Acceso autorizado", user: req.user });
// });


export default authRoutes;
