import TelegramBot from 'node-telegram-bot-api'
import path from 'path'
import { config } from '../../config'
import { readJson } from '../../storage/readJson'
import { VisaEstimate, VisaStream, TempSelection } from '../../types'
import { buildStreamOptions, parseStreamChoice, formatVisaEstimate } from '../keyboards/visaOptions'

const tempCheckSelections = new Map<number, TempSelection>()

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

    handleCheckFlow(bot, chatId, subclass.toUpperCase())
  })

  bot.on('message', (msg) => {
    const chatId = msg.chat.id
    const temp = tempCheckSelections.get(chatId)
    if (!temp || temp.step !== 'awaiting_stream_choice') return
    if (!msg.text) return
    if (msg.text.startsWith('/')) return

    const visas = loadVisas()
    const streams = visas[temp.subclassCode]
    if (!streams) {
      bot.sendMessage(chatId, 'This visa subclass is no longer available.')
      tempCheckSelections.delete(chatId)
      return
    }

    const chosen = parseStreamChoice(msg.text, streams)
    if (!chosen) {
      bot.sendMessage(chatId, `Invalid choice. Reply with a number 1-${streams.length}.`)
      return
    }

    tempCheckSelections.delete(chatId)
    sendEstimate(bot, chatId, chosen.key)
  })
}

async function handleCheckFlow(
  bot: TelegramBot,
  chatId: number,
  subclassCode: string
): Promise<void> {
  const visas = loadVisas()
  const streams = visas[subclassCode]

  if (!streams) {
    bot.sendMessage(
      chatId,
      `Visa subclass *${subclassCode}* not found. Data may not be loaded yet.`,
      { parse_mode: 'Markdown' }
    )
    return
  }

  if (streams.length === 1) {
    sendEstimate(bot, chatId, streams[0].key)
    return
  }

  tempCheckSelections.set(chatId, {
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

function sendEstimate(bot: TelegramBot, chatId: number, visaKey: string): void {
  const latest = loadLatest()
  const est = latest[visaKey]

  if (!est) {
    bot.sendMessage(chatId, `No data available for *${visaKey}*.`, { parse_mode: 'Markdown' })
    return
  }

  const formatted = formatVisaEstimate(est.visaName, est.streamName, est.p90Text)

  bot.sendMessage(chatId, formatted, { parse_mode: 'Markdown' })
}
