import TelegramBot from 'node-telegram-bot-api'
import path from 'path'
import { config } from '../../config'
import { readJson } from '../../storage/readJson'
import { writeJson } from '../../storage/writeJson'
import { Subscriptions, TempSelection, VisaStream } from '../../types'
import { buildStreamOptions, parseStreamChoice } from '../keyboards/visaOptions'

const tempUnsubSelections = new Map<number, TempSelection>()

function loadVisas(): Record<string, VisaStream[]> {
  return readJson<Record<string, VisaStream[]>>(path.join(config.dataDir, 'visas.json'), {})
}

function loadSubscriptions(): Subscriptions {
  return readJson<Subscriptions>(path.join(config.dataDir, 'subscriptions.json'), {})
}

export function registerUnsubscribe(bot: TelegramBot): void {
  bot.onText(/^\/unsubscribe(?:\s+(\w+))?$/, (msg, match) => {
    const chatId = msg.chat.id
    const subclass = match?.[1]

    if (!subclass) {
      bot.sendMessage(chatId, 'Usage: `/unsubscribe <subclass>`\nExample: `/unsubscribe 186`', {
        parse_mode: 'Markdown',
      })
      return
    }

    handleUnsubscribeFlow(bot, chatId, subclass.toUpperCase())
  })

  bot.on('message', (msg) => {
    const chatId = msg.chat.id
    const temp = tempUnsubSelections.get(chatId)
    if (!temp || temp.step !== 'awaiting_stream_choice') return
    if (!msg.text) return
    if (msg.text.startsWith('/')) return

    const visas = loadVisas()
    const streams = visas[temp.subclassCode]
    if (!streams) {
      bot.sendMessage(chatId, 'This visa subclass is no longer available.')
      tempUnsubSelections.delete(chatId)
      return
    }

    const chosen = parseStreamChoice(msg.text, streams)
    if (!chosen) {
      bot.sendMessage(chatId, `Invalid choice. Reply with a number 1-${streams.length}.`)
      return
    }

    tempUnsubSelections.delete(chatId)

    const subs = loadSubscriptions()
    const chatKey = String(chatId)
    const userSubs = subs[chatKey] ?? []

    if (!userSubs.includes(chosen.key)) {
      bot.sendMessage(chatId, `You are not subscribed to *${chosen.streamName}* (${temp.subclassCode}).`, {
        parse_mode: 'Markdown',
      })
      return
    }

    subs[chatKey] = userSubs.filter((k) => k !== chosen.key)
    writeJson(path.join(config.dataDir, 'subscriptions.json'), subs)
    bot.sendMessage(chatId, `❌ Unsubscribed from *${chosen.streamName}* (${temp.subclassCode}).`, {
      parse_mode: 'Markdown',
    })
  })
}

async function handleUnsubscribeFlow(
  bot: TelegramBot,
  chatId: number,
  subclassCode: string
): Promise<void> {
  const visas = loadVisas()
  const streams = visas[subclassCode]

  if (!streams) {
    bot.sendMessage(
      chatId,
      `Visa subclass *${subclassCode}* not found.`,
      { parse_mode: 'Markdown' }
    )
    return
  }

  if (streams.length === 1) {
    const stream = streams[0]
    const subs = loadSubscriptions()
    const chatKey = String(chatId)
    const userSubs = subs[chatKey] ?? []

    if (!userSubs.includes(stream.key)) {
      bot.sendMessage(chatId, `You are not subscribed to *${subclassCode}*.`, {
        parse_mode: 'Markdown',
      })
      return
    }

    subs[chatKey] = userSubs.filter((k) => k !== stream.key)
    writeJson(path.join(config.dataDir, 'subscriptions.json'), subs)
    bot.sendMessage(chatId, `❌ Unsubscribed from *${subclassCode}*.`, {
      parse_mode: 'Markdown',
    })
    return
  }

  tempUnsubSelections.set(chatId, {
    chatId,
    subclassCode,
    visaKey: null,
    step: 'awaiting_stream_choice',
  })

  const msg = [
    `Subclass *${subclassCode}* has multiple streams.`,
    '',
    'Choose one to unsubscribe:',
    '',
    buildStreamOptions(streams),
    '',
    `Reply with 1-${streams.length}.`,
  ].join('\n')

  bot.sendMessage(chatId, msg, { parse_mode: 'Markdown' })
}
