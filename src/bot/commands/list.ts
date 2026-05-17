import TelegramBot from 'node-telegram-bot-api'
import path from 'path'
import { config } from '../../config'
import { readJson } from '../../storage/readJson'
import { Subscriptions, VisaStream } from '../../types'
import { displaySubclass } from '../keyboards/visaOptions'

function loadVisas(): Record<string, VisaStream[]> {
  return readJson<Record<string, VisaStream[]>>(path.join(config.dataDir, 'visas.json'), {})
}

function loadSubscriptions(): Subscriptions {
  return readJson<Subscriptions>(path.join(config.dataDir, 'subscriptions.json'), {})
}

export function registerList(bot: TelegramBot): void {
  bot.onText(/^\/list$/, (msg) => {
    const chatId = msg.chat.id
    const subs = loadSubscriptions()
    const chatKey = String(chatId)
    const userKeys = subs[chatKey]

    if (!userKeys || userKeys.length === 0) {
      bot.sendMessage(
        chatId,
        'You have no subscriptions. Use `/subscribe <subclass>` to add one.',
        { parse_mode: 'Markdown' }
      )
      return
    }

    const visas = loadVisas()

    const keyToName = new Map<string, { subclass: string; stream: string }>()
    for (const [subclassCode, streams] of Object.entries(visas)) {
      for (const stream of streams) {
        keyToName.set(stream.key, {
          subclass: subclassCode,
          stream: stream.streamName,
        })
      }
    }

    const lines: string[] = ['📋 *Your Subscriptions*', '']

    for (const key of userKeys) {
      const info = keyToName.get(key)
      if (info) {
        lines.push(`• *${displaySubclass(info.subclass)}* — ${info.stream}`)
      } else {
        lines.push(`• ${key} _(no longer available)_`)
      }
    }

    bot.sendMessage(chatId, lines.join('\n'), { parse_mode: 'Markdown' })
  })
}
