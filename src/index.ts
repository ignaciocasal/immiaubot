import { config } from './config'
import { collectAll } from './immi/collectAll'
import { createBot } from './bot/telegram'
import { registerStart } from './bot/commands/start'
import { registerSubscribe } from './bot/commands/subscribe'
import { registerUnsubscribe } from './bot/commands/unsubscribe'
import { registerCheck } from './bot/commands/check'
import { registerList } from './bot/commands/list'
import { registerCallbackHandler } from './bot/callbackHandler'
import { dailyCheck } from './jobs/dailyCheck'

async function main(): Promise<void> {
  const mode = process.argv[2] ?? 'bot'

  switch (mode) {
    case 'collect': {
      await collectAll()
      break
    }
    case 'daily-check': {
      try {
        await dailyCheck()
        console.log('Daily check completed')
        process.exit(0)
      } catch (err) {
        console.error('Daily check failed:', err)
        process.exit(1)
      }
    }
    case 'worker': {
      console.log('Worker started')

      // run immediately on boot
      await dailyCheck()

      // then schedule every 24h
      setInterval(async () => {
        try {
          await dailyCheck()
        } catch (err) {
          console.error('Worker daily check failed:', err)
        }
      }, 24 * 60 * 60 * 1000)

      break
    }
    case 'bot':
    default: {
      if (!config.telegramBotToken) {
        console.error('TELEGRAM_BOT_TOKEN is required for bot mode')
        process.exit(1)
      }

      const bot = createBot()

      registerStart(bot)
      registerSubscribe(bot)
      registerUnsubscribe(bot)
      registerCheck(bot)
      registerList(bot)
      registerCallbackHandler(bot)

      console.log('Bot started. Listening for commands...')

      const runDailyCheck = async () => {
        try {
          await dailyCheck()
        } catch (err) {
          console.error('Daily check failed:', err)
        }
      }
      runDailyCheck()
      setInterval(runDailyCheck, 12 * 60 * 60 * 1000)

      if (process.platform === 'win32') {
        const rl = (await import('readline')).createInterface({
          input: process.stdin,
          output: process.stdout,
        })
        rl.on('SIGINT', () => process.exit())
        rl.on('SIGTERM', () => process.exit())
      } else {
        process.on('SIGINT', () => process.exit())
        process.on('SIGTERM', () => process.exit())
      }
    }
  }
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
