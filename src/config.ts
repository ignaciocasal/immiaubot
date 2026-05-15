import dotenv from "dotenv";
dotenv.config();

export const config = {
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
  dataDir: process.env.DATA_DIR || '/data',
  maxRetries: 3,
  retryDelays: [1000, 2000, 5000],
  requestDelayMs: 300,
  isDev: process.env.NODE_ENV === 'development' || !process.env.TELEGRAM_BOT_TOKEN,
}
