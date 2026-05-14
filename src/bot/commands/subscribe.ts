import TelegramBot from 'node-telegram-bot-api'
import path from 'path'
import { config } from '../../config'
import { readJson } from '../../storage/readJson'
import { writeJson } from '../../storage/writeJson'
import { Subscriptions, TempSelection, VisaStream } from '../../types'
import { buildStreamOptions, parseStreamChoice } from '../keyboards/visaOptions'

const tempSelections = new Map<number, TempSelection>()

function loadVisas(): Record<string, VisaStream[]> {
  return readJson<Record<string, VisaStream[]>>(path.join(config.dataDir, 'visas.json'), {})
}

function loadSubscriptions(): Subscriptions {
  return readJson<Subscriptions>(path.join(config.dataDir, 'subscriptions.json'), {})
}

export function registerSubscribe(bot: TelegramBot): void {
  bot.onText(/^\/subscribe(?:\s+(\w+))?$/, (msg, match) => {
    const chatId = msg.chat.id
    const subclass = match?.[1]

    if (!subclass) {
      bot.sendMessage(chatId, 'Usage: `/subscribe <subclass>`\nExample: `/subscribe 186`', {
        parse_mode: 'Markdown',
      })
      return
    }

    handleSubscribeFlow(bot, chatId, subclass.toUpperCase())
  })

  bot.on('message', (msg) => {
    const chatId = msg.chat.id
    const temp = tempSelections.get(chatId)
    if (!temp || temp.step !== 'awaiting_stream_choice') return
    if (!msg.text) return
    if (msg.text.startsWith('/')) return

    const visas = loadVisas()
    const streams = visas[temp.subclassCode]
    if (!streams) {
      bot.sendMessage(chatId, 'This visa subclass is no longer available.')
      tempSelections.delete(chatId)
      return
    }

    const chosen = parseStreamChoice(msg.text, streams)
    if (!chosen) {
      bot.sendMessage(chatId, `Invalid choice. Reply with a number 1-${streams.length}.`)
      return
    }

    tempSelections.delete(chatId)

    const subs = loadSubscriptions()
    const chatKey = String(chatId)
    if (!subs[chatKey]) subs[chatKey] = []

    if (subs[chatKey].includes(chosen.key)) {
      bot.sendMessage(chatId, `You are already subscribed to *${chosen.streamName}* (${temp.subclassCode}).`, {
        parse_mode: 'Markdown',
      })
      return
    }

    subs[chatKey].push(chosen.key)
    writeJson(path.join(config.dataDir, 'subscriptions.json'), subs)
    bot.sendMessage(chatId, `✅ Subscribed to *${chosen.streamName}* (${temp.subclassCode}).`, {
      parse_mode: 'Markdown',
    })
  })
}

async function handleSubscribeFlow(
  bot: TelegramBot,
  chatId: number,
  subclassCode: string
): Promise<void> {
  const visas = loadVisas()
  const streams = visas[subclassCode]

  if (!streams) {
    bot.sendMessage(
      chatId,
      `Visa subclass *${subclassCode}* not found. Check /start for usage.`,
      { parse_mode: 'Markdown' }
    )
    return
  }

  if (streams.length === 1) {
    const stream = streams[0]
    const subs = loadSubscriptions()
    const chatKey = String(chatId)
    if (!subs[chatKey]) subs[chatKey] = []

    if (subs[chatKey].includes(stream.key)) {
      bot.sendMessage(chatId, `You are already subscribed to *${subclassCode}*.`, {
        parse_mode: 'Markdown',
      })
      return
    }

    subs[chatKey].push(stream.key)
    writeJson(path.join(config.dataDir, 'subscriptions.json'), subs)
    bot.sendMessage(chatId, `✅ Subscribed to *${subclassCode}* — ${stream.streamName}.`, {
      parse_mode: 'Markdown',
    })
    return
  }

  tempSelections.set(chatId, {
    chatId,
    subclassCode,
    visaKey: null,
    step: 'awaiting_stream_choice',
  })

  const msg = [
    `Subclass *${subclassCode}* has multiple streams.`,
    '',
    'Choose one:',
    '',
    buildStreamOptions(streams),
    '',
    `Reply with 1-${streams.length}.`,
  ].join('\n')

  bot.sendMessage(chatId, msg, { parse_mode: 'Markdown' })
}
