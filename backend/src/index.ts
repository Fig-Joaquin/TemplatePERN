import "reflect-metadata";
import express, { Application, Request, Response } from "express";
import cookieParser from "cookie-parser";
import { AppDataSource } from "./config/ormconfig";
import routes from "./routes";
import cors from "cors";
import { startNotificationCron } from "./utils/notificationScheduler";


// Imports de rutas
//import vehicleRoutes from "./routes/vehicleRoutes";

const app: Application = express();


// Middlewares
app.use(express.json());
app.use(cookieParser()); // Middleware para manejar cookies


app.use(cors({
    origin: process.env.FRONTEND_URL, // Permitir el frontend
    credentials: true, // Permite enviar cookies y cabeceras de autenticación
    methods: ["GET", "POST", "PUT", "DELETE"], // Métodos permitidos
}));

// ! Rutas de acceso API
app.use(routes);

//app.use("/vehicles", vehicleRoutes);

// Ruta para establecer cookies como ejemplo
app.get("/set-cookie", (_req: Request, res: Response): void => {
    res.cookie("token", "your_jwt_token", {
        httpOnly: true, // Impide el acceso desde JavaScript
        secure: process.env.NODE_ENV === "production", // Solo HTTPS en producción
        sameSite: "strict", // Protege contra CSRF
        maxAge: 60 * 60 * 1000, // 1 hora
    });
    res.send("Cookie set");
});

// Ruta para leer cookies como ejemplo
app.get("/read-cookie", (req: Request, res: Response): void => {
    const token = req.cookies?.token;
    if (!token) {
        res.status(401).json({ message: "No token provided" });
        return;
    }
    res.send(`Token: ${token}`);
});

const startServer = async () => {
    try {
        await AppDataSource.initialize();
        console.log("Database connected");

        startNotificationCron(); // Iniciar cron de notificaciones

        // Iniciar el servidor
        const PORT = process.env.PORT || 4000;
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Error during initialization:", error);
    }
};

startServer();
