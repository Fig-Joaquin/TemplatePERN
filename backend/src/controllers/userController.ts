// src/controllers/userController.ts
import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { AppDataSource } from "../config/ormconfig";
import { User, Person } from "../entities";
import { hash, compare } from "bcryptjs";
import { UserSchema, UpdateUserSchema } from "../schema/usersValidator";
import { AuthRequest } from "../middleware/authMiddleware";

const userRepository = AppDataSource.getRepository(User);
const personRepository = AppDataSource.getRepository(Person);


export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: "No autenticado" });
    return;
  }

  res.json({ message: "Perfil del usuario", user: req.user });
};


export const createUser = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
  try {
    const validationResult = UserSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({ errors: validationResult.error.errors });
      return;
    }
    // Extraer person_id directamente de los datos validados
    const { user_role, username, password, person_id } = validationResult.data;
    if (!person_id) {
      res.status(400).json({ message: "Person ID missing" });
      return;
    }
    const person = await personRepository.findOne({ where: { person_id } });
    if (!person) {
      res.status(404).json({ message: "Person not found" });
      return;
    }
    const hashedPassword = await hash(password, 10);
    const user = new User();
    user.person = person;
    user.user_role = user_role;
    user.username = username;
    user.password = hashedPassword;
    await userRepository.save(user);
    res.status(201).json({ message: "User created successfully" });
    return;
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error });
    return;
  }
};

export const getAllUsers = async (_req: Request, res: Response, _next: NextFunction): Promise<void> => {
  try {
    const users = await userRepository.find({ relations: ["person"] });
    res.json(users);
    return;
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error });
    return;
  }
};

export const getUserById = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await userRepository.findOne({
      where: { user_id: parseInt(id) },
      relations: ["person"]
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.json(user);
    return;
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error });
    return;
  }
};

export const updateUser = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const validationResult = UpdateUserSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({ errors: validationResult.error.errors });
      return;
    }

    const { user_role, username, password } = validationResult.data;

    const user = await userRepository.findOneBy({ user_id: parseInt(id) });
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    if (user_role) user.user_role = user_role;
    if (username) user.username = username;
    if (password) {
      user.password = await hash(password, 10);
    }

    await userRepository.save(user);
    res.json({ message: "User updated successfully" });
    return;
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error });
    return;
  }
};

export const deleteUser = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await userRepository.findOneBy({ user_id: parseInt(id) });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    await userRepository.remove(user);
    res.json({ message: "User deleted successfully" });
    return;
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error });
    return;
  }
};

export const loginUser = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
  try {
    const { username, password } = req.body;

    const user = await userRepository.findOne({
      where: { username },
      relations: ["person"]
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const validPassword = await compare(password, user.password);
    if (!validPassword) {
      res.status(401).json({ message: "Invalid password" });
      return;
    }

    res.json({
      message: "Login successful",
      user: {
        userId: user.user_id,
        username: user.username,
        userRole: user.user_role,
        person: user.person
      }
    });
    return;
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error });
    return;
  }
};

// Crear usuario con persona en una sola operación
export const createUserWithPerson = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
  try {
    // Esquema de validación para la creación completa
    const createUserWithPersonSchema = z.object({
      // Datos de persona - usando validación opcional para email y rut
      name: z.string().min(2, "Nombre debe tener al menos 2 caracteres").max(50),
      first_surname: z.string().min(2, "Apellido paterno debe tener al menos 2 caracteres").max(50),
      second_surname: z.string().max(50).optional(),
      email: z
        .string()
        .optional()
        .transform((val) => (val?.trim() === "" ? undefined : val?.trim()))
        .refine(
          (val) => val == null || val.length >= 5, 
          { message: "Email debe tener entre 5 y 100 caracteres" }
        )
        .refine(
          (val) => val == null || val.length <= 100, 
          { message: "Email debe tener entre 5 y 100 caracteres" }
        )
        .refine(
          (val) => val == null || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
          { message: "Email inválido" }
        ),
      number_phone: z.string().min(7, "Teléfono debe tener al menos 7 caracteres").max(15),
      person_type: z.enum(["cliente", "proveedor"]),
      rut: z
        .string()
        .optional()
        .transform((val) => (val?.trim() === "" ? undefined : val?.trim()))
        .refine(
          (val) => val == null || /^\d{8,9}[Kk\d]$/.test(val),
          { message: "RUT debe contener solo números y dígito verificador (K)" }
        ),
      // Datos de usuario
      user_role: z.string().min(3, "Rol de usuario es requerido"),
      username: z.string().min(4, "Nombre de usuario debe tener al menos 4 caracteres"),
      password: z.string().min(8, "Contraseña debe tener al menos 8 caracteres"),
    });

    const validationResult = createUserWithPersonSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      res.status(400).json({ 
        message: "Datos de entrada inválidos",
        errors: validationResult.error.errors 
      });
      return;
    }

    const {
      // Datos de persona
      name,
      first_surname,
      second_surname,
      email,
      number_phone,
      person_type,
      rut,
      // Datos de usuario
      user_role,
      username,
      password
    } = validationResult.data;

    // Verificar si ya existe una persona con ese RUT o email (solo si no son undefined)
    const whereConditions = [];
    if (rut) {
      whereConditions.push({ rut });
    }
    if (email) {
      whereConditions.push({ email });
    }
    
    let existingPerson = null;
    if (whereConditions.length > 0) {
      existingPerson = await personRepository.findOne({
        where: whereConditions
      });
    }

    if (existingPerson) {
      res.status(400).json({ message: "Ya existe una persona con ese RUT o email" });
      return;
    }

    // Verificar si ya existe un usuario con ese username
    const existingUser = await userRepository.findOne({ where: { username } });
    if (existingUser) {
      res.status(400).json({ message: "El nombre de usuario ya está en uso" });
      return;
    }

    // Crear la persona primero
    const person = new Person();
    person.name = name;
    person.first_surname = first_surname;
    person.second_surname = second_surname;
    person.email = email;
    person.number_phone = number_phone;
    person.person_type = person_type;
    person.rut = rut;

    const savedPerson = await personRepository.save(person);

    // Crear el usuario
    const hashedPassword = await hash(password, 10);
    const user = new User();
    user.person = savedPerson;
    user.user_role = user_role;
    user.username = username;
    user.password = hashedPassword;

    const savedUser = await userRepository.save(user);

    // Buscar el usuario con la relación de persona cargada
    const userWithPerson = await userRepository.findOne({
      where: { user_id: savedUser.user_id },
      relations: ["person"]
    });

    res.status(201).json({
      message: "Usuario y persona creados exitosamente",
      user: userWithPerson
    });
    return;
  } catch (error) {
    console.error("Error creating user with person:", error);
    res.status(500).json({ message: "Error interno del servidor", error });
    return;
  }
};
