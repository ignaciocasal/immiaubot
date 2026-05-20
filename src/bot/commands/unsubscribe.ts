import TelegramBot from 'node-telegram-bot-api'
import path from 'path'
import { config } from '../../config'
import { readJson } from '../../storage/readJson'
import { writeJson } from '../../storage/writeJson'
import { Subscriptions, VisaStream } from '../../types'
import { buildStreamKeyboard, resolveSubclass, displaySubclass, buildSubclassKeyboard, getPopularSubclasses } from '../keyboards/visaOptions'

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
      const visas = loadVisas()
      const popular = getPopularSubclasses(visas)
      bot.sendMessage(chatId, 'Which visa subclass? Tap one below or type:\n`/unsubscribe <subclass>`', {
        parse_mode: 'Markdown',
        reply_markup: buildSubclassKeyboard(popular, 'uv'),
      })
      return
    }

    const visas = loadVisas()
    const resolved = resolveSubclass(subclass, visas)

    if (!resolved) {
      bot.sendMessage(
        chatId,
        `Visa subclass *${subclass.toUpperCase()}* not found.`,
        { parse_mode: 'Markdown' }
      )
      return
    }

    const streams = visas[resolved]

    if (streams.length === 1) {
      unsubscribeFromStream(bot, chatId, streams[0])
      return
    }

    bot.sendMessage(chatId, `Subclass *${displaySubclass(resolved)}* has multiple streams:\n\nChoose one:`, {
      parse_mode: 'Markdown',
      reply_markup: buildStreamKeyboard(streams, 'us'),
    })
  })
}

function unsubscribeFromStream(bot: TelegramBot, chatId: number, stream: VisaStream): void {
  const subs = loadSubscriptions()
  const chatKey = String(chatId)
  const userSubs = subs[chatKey] ?? []

  if (!userSubs.includes(stream.key)) {
    bot.sendMessage(chatId, `You are not subscribed to *${stream.streamName}* (${displaySubclass(stream.key.split(':')[0])}).`, {
      parse_mode: 'Markdown',
    })
    return
  }

  subs[chatKey] = userSubs.filter(k => k !== stream.key)
  writeJson(path.join(config.dataDir, 'subscriptions.json'), subs)
  bot.sendMessage(chatId, `❌ Unsubscribed from *${stream.streamName}* (${displaySubclass(stream.key.split(':')[0])}).`, {
    parse_mode: 'Markdown',
  })
}
