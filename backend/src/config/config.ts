import dotenv from 'dotenv';

dotenv.config();

export const config = {
  db: {
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'admin@7120',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'tallerDB',
  },
  ollama: {
    url: process.env.OLLAMA_API_URL || 'http://localhost:11434',
    model: 'llama3',
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
  },
  // Other configurations...
};
