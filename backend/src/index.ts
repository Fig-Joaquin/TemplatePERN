import "reflect-metadata";
import express, { Application } from "express";
import cookieParser from "cookie-parser";
import { AppDataSource } from "./config/ormconfig";
import routes from "./routes";
import cors from "cors";
import { startNotificationCron } from "./utils/notificationScheduler";
import { errorHandler } from "./middleware/errorMiddleware";


// Imports de rutas
//import vehicleRoutes from "./routes/vehicleRoutes";

const app: Application = express();


// Middlewares
app.use(express.json());
app.use(cookieParser()); // Middleware para manejar cookies


app.use(cors({
    origin: process.env.FRONTEND_URL, // Permitir el frontend
    credentials: true, // Permite enviar cookies y cabeceras de autenticación
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"], // Métodos permitidos
}));

// ! Rutas de acceso API
app.use(routes);

// Middleware de manejo de errores (debe ir después de las rutas)
app.use(errorHandler);

//app.use("/vehicles", vehicleRoutes);


const startServer = async (): Promise<void> => {
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
