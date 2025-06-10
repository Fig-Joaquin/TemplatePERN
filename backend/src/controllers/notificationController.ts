

import { Request, Response } from "express";
import { AppDataSource } from "../config/ormconfig";
import { Notification } from "../entities/notificationEntity";

const notifRepo = AppDataSource.getRepository(Notification);

export const getNotifications = async (_req: Request, res: Response): Promise<void> => {
  const list = await notifRepo.find({ order: { created_at: "DESC" } });
  res.json(list);
};

