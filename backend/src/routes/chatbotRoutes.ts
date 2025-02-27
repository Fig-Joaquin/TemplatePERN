import { Router } from 'express';
import { handleChatQuery, handleChatFeedback, resetChatSession } from '../controllers/chatbot/chatbotController';

const router = Router();

router.post("/query", handleChatQuery);
router.post("/feedback", handleChatFeedback);
router.post("/reset", resetChatSession);

export default router;
