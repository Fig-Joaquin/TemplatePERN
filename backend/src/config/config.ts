import dotenv from 'dotenv';

dotenv.config();

// ── Critical variable validation ─────────────────────────────────────────────
// Fail-fast on startup if required secrets are missing.
const requiredEnvVars = ['DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET'] as const;
for (const key of requiredEnvVars) {
  if (!process.env[key]) {
    throw new Error(`❌ Missing required environment variable: ${key}`);
  }
}

export const config = {
  db: {
    user: process.env.DB_USER as string,
    password: process.env.DB_PASSWORD as string,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME as string,
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
