import TelegramBot from 'node-telegram-bot-api'
import path from 'path'
import { config } from '../../config'
import { readJson } from '../../storage/readJson'
import { VisaEstimate, VisaStream } from '../../types'
import { buildStreamKeyboard, formatVisaEstimate, resolveSubclass, displaySubclass } from '../keyboards/visaOptions'

function loadVisas(): Record<string, VisaStream[]> {
  return readJson<Record<string, VisaStream[]>>(path.join(config.dataDir, 'visas.json'), {})
}

function loadLatest(): Record<string, VisaEstimate> {
  return readJson<Record<string, VisaEstimate>>(path.join(config.dataDir, 'latest.json'), {})
}

export function registerCheck(bot: TelegramBot): void {
  bot.onText(/^\/check(?:\s+(\w+))?$/, (msg, match) => {
    const chatId = msg.chat.id
    const subclass = match?.[1]

    if (!subclass) {
      bot.sendMessage(chatId, 'Usage: `/check <subclass>`\nExample: `/check 186`', {
        parse_mode: 'Markdown',
      })
      return
    }

    const visas = loadVisas()
    const resolved = resolveSubclass(subclass, visas)

    if (!resolved) {
      bot.sendMessage(
        chatId,
        `Visa subclass *${subclass.toUpperCase()}* not found. Data may not be loaded yet.`,
        { parse_mode: 'Markdown' }
      )
      return
    }

    const streams = visas[resolved]

    if (streams.length === 1) {
      sendEstimate(bot, chatId, streams[0].key)
      return
    }

    bot.sendMessage(chatId, `Subclass *${displaySubclass(resolved)}* has multiple streams:\n\nChoose one:`, {
      parse_mode: 'Markdown',
      reply_markup: buildStreamKeyboard(streams, 'cs'),
    })
  })
}

function sendEstimate(bot: TelegramBot, chatId: number, visaKey: string): void {
  const latest = loadLatest()
  const est = latest[visaKey]

  if (!est) {
    bot.sendMessage(chatId, `No data available for *${visaKey}*.`, { parse_mode: 'Markdown' })
    return
  }

  bot.sendMessage(chatId, formatVisaEstimate(est.visaName, est.streamName, est.p90Text), {
    parse_mode: 'Markdown',
    reply_markup: { inline_keyboard: [[{ text: '🔔 Subscribe to updates', callback_data: `ss:${visaKey}` }]] },
  })
}
