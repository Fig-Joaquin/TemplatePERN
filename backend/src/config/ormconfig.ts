import { DataSource } from "typeorm";
import dotenv from "dotenv";

dotenv.config(); // Carga variables desde .env

export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    synchronize: true, // Solo en desarrollo. Cambia a false en producción.
    logging: true, // Útil para depuración.
    entities: ["src/models/**/*.ts"], // Ruta de las entidades.
    migrations: ["src/migrations/**/*.ts"], // Ruta de las migraciones.
});
