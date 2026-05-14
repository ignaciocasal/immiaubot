import TelegramBot from 'node-telegram-bot-api'
import path from 'path'
import { config } from '../config'
import { readJson } from '../storage/readJson'
import { Subscriptions, Change } from '../types'

function loadSubscriptions(): Subscriptions {
  return readJson<Subscriptions>(path.join(config.dataDir, 'subscriptions.json'), {})
}

function formatChange(change: Change): string {
  const c = change.changes[0]
  const arrow = c.to !== null && c.from !== null && c.to < c.from ? '⬇️' : '⬆️'
  const fromStr = c.fromText ?? `${c.from} days`
  const toStr = c.toText ?? `${c.to} days`

  return [
    '📢 *Visa Processing Time Updated*',
    '',
    `${change.visaName}${change.streamName ? ` (${change.streamName})` : ''}`,
    '',
    `${arrow} *90%*: ${fromStr} → ${toStr}`,
  ].join('\n')
}

export async function notifyUsers(
  bot: TelegramBot,
  changes: Change[]
): Promise<number> {
  if (changes.length === 0) {
    console.log('No changes to notify')
    return 0
  }

  const subs = loadSubscriptions()
  let sentCount = 0

  for (const change of changes) {
    const message = formatChange(change)
    console.log(`Change detected: ${change.key} (${change.changes.length} updates)`)

    for (const [chatId, visaKeys] of Object.entries(subs)) {
      if (!visaKeys.includes(change.key)) continue

      try {
        await bot.sendMessage(Number(chatId), message, { parse_mode: 'Markdown' })
        sentCount++
        await new Promise((r) => setTimeout(r, 100))
      } catch (err) {
        console.error(`Failed to notify ${chatId}:`, (err as Error).message)
      }
    }
  }

  console.log(`Sent ${sentCount} notifications`)
  return sentCount
}
