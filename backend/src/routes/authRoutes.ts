// src/routes/authRoutes.ts
import { Router } from "express";
import { login } from "../controllers/authController";

const authRouter = Router();

authRouter.post("/", login);

export default authRouter;
