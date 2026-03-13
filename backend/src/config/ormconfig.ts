/* eslint-disable no-console */
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
    synchronize: true, // Desactivado temporalmente - la migración SQL ya creó las columnas
    // synchronize: process.env.NODE_ENV !== "production", // Descomentar cuando el esquema esté sincronizado
    migrations: ["dist/migrations/*.js"],
    logging: process.env.NODE_ENV !== "production", // No loggear en producción
    entities: Object.values(entities), // Carga todas las entidades automáticamente
});

// console.log("📌 Entidades registradas en TypeORM:", AppDataSource.options.entities);

AppDataSource.initialize()
  .then(() => console.log("📦 Base de datos conectada"))
  .catch((err) => {
    console.error("❌ Error al conectar la base de datos:", err);
    process.exit(1);
  });
