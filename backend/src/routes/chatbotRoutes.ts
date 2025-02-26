import { Router } from 'express';
import { handleChatQuery, handleChatFeedback } from '../controllers/chatbot/chatbotController';

const router = Router();

router.post("/query", handleChatQuery);
router.post("/feedback", handleChatFeedback);

export default router;
