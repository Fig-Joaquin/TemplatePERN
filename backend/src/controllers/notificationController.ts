

import { Request, Response } from "express";
import { AppDataSource } from "../config/ormconfig";
import { Notification } from "../entities/notificationEntity";

const notifRepo = AppDataSource.getRepository(Notification);

export const getNotifications = async (_req: Request, res: Response): Promise<void> => {
  const list = await notifRepo.find({ order: { created_at: "DESC" } });
  res.json(list);
};

export const deleteNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const notification = await notifRepo.findOneBy({ notification_id: parseInt(id) });
    
    if (!notification) {
      res.status(404).json({ message: "Notificación no encontrada" });
      return;
    }

    await notifRepo.remove(notification);
    res.json({ message: "Notificación eliminada correctamente" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

export const deleteAllNotifications = async (_req: Request, res: Response): Promise<void> => {
  try {
    await notifRepo.clear();
    res.json({ message: "Todas las notificaciones han sido eliminadas" });
  } catch (error) {
    console.error("Error deleting all notifications:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

