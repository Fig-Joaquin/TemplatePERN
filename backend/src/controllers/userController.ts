// src/controllers/userController.ts
import { Request, Response, NextFunction } from "express";
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
