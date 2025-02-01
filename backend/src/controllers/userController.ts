import { Request, Response } from "express";
import { AppDataSource } from "../config/ormconfig";
import { User } from "../entities/usersEntity";
import { Person } from "../entities/personsEntity";
import { hash, compare } from "bcryptjs";
import { UserSchema, UpdateUserSchema } from "../schema/usersValidator";

const userRepository = AppDataSource.getRepository(User);
const personRepository = AppDataSource.getRepository(Person);

export const createUser = async (req: Request, res: Response) => {
    try {
        const validationResult = UserSchema.safeParse(req.body);
        if (!validationResult.success) {
            return res.status(400).json({ errors: validationResult.error.errors });
        }

        const { person_id, user_role, username, password } = validationResult.data;

        const person = await personRepository.findOne({
            where: { person_id: person_id }
        });
        if (!person) {
            return res.status(404).json({ message: "Person not found" });
        }

        const hashedPassword = await hash(password, 10);

        const user = new User();
        user.person_id = person_id;
        user.user_role = user_role;
        user.username = username;
        user.password = hashedPassword;

        await userRepository.save(user);
        return res.status(201).json({ message: "User created successfully" });

    } catch (error) {
        return res.status(500).json({ message: "Internal server error", error });
    }
};

export const getAllUsers = async (_req: Request, res: Response) => {
    try {
        const users = await userRepository.find({
            relations: ["person"]
        });
        return res.json(users);
    } catch (error) {
        return res.status(500).json({ message: "Internal server error", error });
    }
};

export const getUserById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = await userRepository.findOne({
            where: { user_id: parseInt(id) },
            relations: ["person"]
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.json(user);
    } catch (error) {
        return res.status(500).json({ message: "Internal server error", error });
    }
};

export const updateUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const validationResult = UpdateUserSchema.safeParse(req.body);
        if (!validationResult.success) {
            return res.status(400).json({ errors: validationResult.error.errors });
        }

        const { user_role, username, password } = validationResult.data;

        const user = await userRepository.findOneBy({ user_id: parseInt(id) });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user_role) user.user_role = user_role;
        if (username) user.username = username;
        if (password) {
            user.password = await hash(password, 10);
        }

        await userRepository.save(user);
        return res.json({ message: "User updated successfully" });

    } catch (error) {
        return res.status(500).json({ message: "Internal server error", error });
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = await userRepository.findOneBy({ user_id: parseInt(id) });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        await userRepository.remove(user);
        return res.json({ message: "User deleted successfully" });

    } catch (error) {
        return res.status(500).json({ message: "Internal server error", error });
    }
};

export const loginUser = async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;

        const user = await userRepository.findOne({
            where: { username },
            relations: ["person"]
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const validPassword = await compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ message: "Invalid password" });
        }

        return res.json({
            message: "Login successful",
            user: {
                userId: user.user_id,
                username: user.username,
                userRole: user.user_role,
                person: user.person
            }
        });

    } catch (error) {
        return res.status(500).json({ message: "Internal server error", error });
    }
};
