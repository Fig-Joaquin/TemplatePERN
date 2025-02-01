import { DataSource } from "typeorm";
import dotenv from "dotenv";
import * as entities from "../entities"; // Importa todas las entidades desde el archivo barril

dotenv.config(); // Carga variables desde .env

console.log("Modo de ejecución:", process.env.NODE_ENV);

export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    // synchronize: process.env.NODE_ENV !== "production", // Desactivar en producción
    synchronize: true, //! Comentar cuando esté en producción
    logging: process.env.NODE_ENV !== "production", // No loggear en producción
    entities: Object.values(entities), // Carga todas las entidades automáticamente
});

console.log("📌 Entidades registradas en TypeORM:", AppDataSource.options.entities);

AppDataSource.initialize()
  .then(() => console.log("📦 Base de datos conectada"))
  .catch((err) => {
    console.error("❌ Error al conectar la base de datos:", err);
    process.exit(1);
  });
