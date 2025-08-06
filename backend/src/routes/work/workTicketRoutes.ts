import { Router } from "express";
import {
    getAllWorkTickets,
    getWorkTicketById,
    getWorkTicketsByWorkOrderId,
    createWorkTicket,
    updateWorkTicket,
    deleteWorkTicket,
} from "../../controllers/work/workTicketController";

const router = Router();

router.get("/", getAllWorkTickets);
router.get("/:id", getWorkTicketById);
router.get("/workorder/:workOrderId", getWorkTicketsByWorkOrderId);
router.post("/", createWorkTicket);
router.put("/:id", updateWorkTicket);
router.delete("/:id", deleteWorkTicket);

export default router;
