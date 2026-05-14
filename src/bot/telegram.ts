import TelegramBot from 'node-telegram-bot-api'
import { config } from '../config'

let bot: TelegramBot | null = null

export function getBot(): TelegramBot {
  if (!bot) {
    bot = new TelegramBot(config.telegramBotToken, { polling: true })
  }
  return bot
}

export function createBot(): TelegramBot {
  return new TelegramBot(config.telegramBotToken, { polling: true })
}

export function createBotWithoutPolling(): TelegramBot {
  return new TelegramBot(config.telegramBotToken)
}
