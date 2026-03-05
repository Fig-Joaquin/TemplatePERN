/* eslint-disable no-console */
/**
 * Script para insertar usuario administrador inicial
 * Ejecutar con: npx ts-node src/scripts/seedAdminUser.ts
 */

import { AppDataSource } from "../config/ormconfig";
import { User, Person } from "../entities";
import { hash } from "bcryptjs";

async function seedAdminUser() {
  try {
    console.log("🔄 Inicializando conexión a la base de datos...");
    
    // Asegurar que la conexión esté inicializada
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const personRepository = AppDataSource.getRepository(Person);
    const userRepository = AppDataSource.getRepository(User);

    console.log("🔍 Verificando si ya existe el usuario administrador...");
    
    // Verificar si ya existe el usuario
    const existingUser = await userRepository.findOne({
      where: { username: "admin" }
    });

    if (existingUser) {
      console.log("⚠️  El usuario 'admin' ya existe en la base de datos.");
      console.log("✅ No es necesario crear el usuario nuevamente.");
      process.exit(0);
    }

    console.log("👤 Creando persona...");
    
    // Crear la persona
    const newPerson = personRepository.create({
      rut: "156473529",
      name: "Ronald",
      first_surname: "Rubilar",
      second_surname: "Medina",
      email: "Ronald@gmail.com",
      number_phone: "56911223344", // Sin el símbolo +
      person_type: "administrador"
    });

    const savedPerson = await personRepository.save(newPerson);
    console.log(`✅ Persona creada con ID: ${savedPerson.person_id}`);

    console.log("🔐 Hasheando contraseña...");
    
    // Hashear la contraseña
    const hashedPassword = await hash("Admin123@", 10);

    console.log("👨‍💼 Creando usuario administrador...");
    
    // Crear el usuario
    const newUser = userRepository.create({
      person: savedPerson,
      user_role: "administrador",
      username: "admin",
      password: hashedPassword
    });

    const savedUser = await userRepository.save(newUser);
    console.log(`✅ Usuario creado con ID: ${savedUser.user_id}`);

    console.log("\n🎉 ¡Usuario administrador creado exitosamente!");

    await AppDataSource.destroy();
    process.exit(0);

  } catch (error) {
    console.error("\n❌ Error al crear el usuario administrador:", error);
    
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
    
    process.exit(1);
  }
}

// Ejecutar el script
seedAdminUser();
