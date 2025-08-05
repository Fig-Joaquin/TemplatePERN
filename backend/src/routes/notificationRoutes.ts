import { Router } from "express";
import { getNotifications, deleteNotification, deleteAllNotifications } from "../controllers/notificationController";

const router = Router();
router.get("/", getNotifications);
router.delete("/:id", deleteNotification);
router.delete("/", deleteAllNotifications);
export default router;
