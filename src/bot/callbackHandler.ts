import TelegramBot from 'node-telegram-bot-api'
import path from 'path'
import { config } from '../config'
import { readJson } from '../storage/readJson'
import { writeJson } from '../storage/writeJson'
import { VisaEstimate, Subscriptions } from '../types'
import { buildStreamKeyboard, formatVisaEstimate, displaySubclass } from './keyboards/visaOptions'

interface CbQuery {
  id: string
  message?: { chat: { id: number }; message_id: number }
  data?: string
}

function loadVisas(): Record<string, { key: string; streamName: string }[]> {
  return readJson(path.join(config.dataDir, 'visas.json'), {})
}

function loadLatest(): Record<string, VisaEstimate> {
  return readJson<Record<string, VisaEstimate>>(path.join(config.dataDir, 'latest.json'), {})
}

function loadSubscriptions(): Subscriptions {
  return readJson<Subscriptions>(path.join(config.dataDir, 'subscriptions.json'), {})
}

function streamNameForKey(visaKey: string): string {
  const visas = loadVisas()
  for (const streams of Object.values(visas)) {
    for (const s of streams) {
      if (s.key === visaKey) return s.streamName
    }
  }
  return visaKey
}

export function registerCallbackHandler(bot: TelegramBot): void {
  bot.on('callback_query', (query) => {
    const cbQuery = query as unknown as CbQuery
    const chatId = cbQuery.message?.chat.id
    if (!chatId || !cbQuery.data) return

    bot.answerCallbackQuery(cbQuery.id)

    const colon = cbQuery.data.indexOf(':')
    if (colon === -1) return

    const action = cbQuery.data.substring(0, colon)
    const param = cbQuery.data.substring(colon + 1)
    const msgId = cbQuery.message!.message_id

    switch (action) {
      case 'cs':
        sendEstimateAndClean(bot, chatId, msgId, param)
        break
      case 'ss':
        confirmSubscribe(bot, chatId, msgId, param)
        break
      case 'us':
        confirmUnsubscribe(bot, chatId, msgId, param)
        break
    }
  })
}

function sendEstimateAndClean(
  bot: TelegramBot,
  chatId: number,
  msgId: number,
  visaKey: string
): void {
  const latest = loadLatest()
  const est = latest[visaKey]

  if (!est) {
    bot.editMessageText(`No data available for *${visaKey}*.`, {
      chat_id: chatId, message_id: msgId, parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: [] },
    })
    return
  }

  bot.editMessageText(formatVisaEstimate(est.visaName, est.streamName, est.p90Text), {
    chat_id: chatId, message_id: msgId, parse_mode: 'Markdown',
    reply_markup: { inline_keyboard: [[{ text: '🔔 Subscribe to updates', callback_data: `ss:${visaKey}` }]] },
  })
}

function confirmSubscribe(
  bot: TelegramBot,
  chatId: number,
  msgId: number,
  visaKey: string
): void {
  const subs = loadSubscriptions()
  const chatKey = String(chatId)
  if (!subs[chatKey]) subs[chatKey] = []

  if (subs[chatKey].includes(visaKey)) {
    bot.editMessageText(`You are already subscribed to this visa.`, {
      chat_id: chatId, message_id: msgId,
      reply_markup: { inline_keyboard: [] },
    })
    return
  }

  subs[chatKey].push(visaKey)
  writeJson(path.join(config.dataDir, 'subscriptions.json'), subs)

  const name = streamNameForKey(visaKey)
  const sc = displaySubclass(visaKey.split(':')[0])

  bot.editMessageText(`✅ Subscribed to *${name}* (${sc}).`, {
    chat_id: chatId, message_id: msgId, parse_mode: 'Markdown',
    reply_markup: { inline_keyboard: [] },
  })
}

function confirmUnsubscribe(
  bot: TelegramBot,
  chatId: number,
  msgId: number,
  visaKey: string
): void {
  const subs = loadSubscriptions()
  const chatKey = String(chatId)
  const userSubs = subs[chatKey] ?? []

  if (!userSubs.includes(visaKey)) {
    bot.editMessageText(`You are not subscribed to this visa.`, {
      chat_id: chatId, message_id: msgId,
      reply_markup: { inline_keyboard: [] },
    })
    return
  }

  subs[chatKey] = userSubs.filter(k => k !== visaKey)
  writeJson(path.join(config.dataDir, 'subscriptions.json'), subs)

  const name = streamNameForKey(visaKey)
  const sc = displaySubclass(visaKey.split(':')[0])

  bot.editMessageText(`❌ Unsubscribed from *${name}* (${sc}).`, {
    chat_id: chatId, message_id: msgId, parse_mode: 'Markdown',
    reply_markup: { inline_keyboard: [] },
  })
}
