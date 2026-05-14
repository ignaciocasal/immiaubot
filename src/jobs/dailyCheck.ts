import path from 'path'
import { config } from '../config'
import { readJson } from '../storage/readJson'
import { writeJson } from '../storage/writeJson'
import { collectAll } from '../immi/collectAll'
import { detectChanges } from './detectChanges'
import { notifyUsers } from './notifyUsers'
import { VisaEstimate, Change } from '../types'
import { createBotWithoutPolling } from '../bot/telegram'

export async function dailyCheck(): Promise<void> {
  console.log('=== Daily Visa Check ===')
  console.log('Timestamp:', new Date().toISOString())

  const latestPath = path.join(config.dataDir, 'latest.json')
  const changesPath = path.join(config.dataDir, 'changes.json')

  const previous = readJson<Record<string, VisaEstimate>>(latestPath, {})

  await collectAll()

  const current = readJson<Record<string, VisaEstimate>>(latestPath, {})

  const changes = detectChanges(previous, current)

  writeJson(changesPath, {
    date: new Date().toISOString().slice(0, 10),
    changes,
  })

  console.log(`Detected ${changes.length} visa updates`)

  if (changes.length > 0 && config.telegramBotToken) {
    const bot = createBotWithoutPolling()
    await notifyUsers(bot, changes)
  } else if (changes.length > 0) {
    console.log('No bot token configured, skipping notifications')
  }
}
