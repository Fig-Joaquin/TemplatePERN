import express from 'express';
import { Request, Response } from 'express'; // Add the Request and Response types
import { handleChatQuery, handleChatFeedback, resetChatSession } from '../controllers/chatbot/chatbotController';

const router = express.Router();

// POST endpoint for chatbot queries
router.post('/query', async (req: Request, res: Response) => {
  try {
	await handleChatQuery(req, res);
  } catch {
	res.status(500).json({ error: 'An error occurred' });
  }
});
router.post('/feedback', async (req: Request, res: Response) => {
  try {
	await handleChatFeedback(req, res);
  } catch {
	res.status(500).json({ error: 'An error occurred' });
  }
});
router.post('/reset', async (req: Request, res: Response) => {
  try {
	await resetChatSession(req, res);
  } catch {
	res.status(500).json({ error: 'An error occurred' });
  }
});

export default router;
