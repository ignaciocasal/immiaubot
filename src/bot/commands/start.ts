import TelegramBot from 'node-telegram-bot-api'

export function registerStart(bot: TelegramBot): void {
  bot.onText(/^\/start$/, (msg) => {
    const chatId = msg.chat.id
    const welcome = [
      '🇦🇺 *Australian Visa Processing Times Bot*',
      '',
      'Track changes to visa processing times from the Department of Home Affairs.',
      '',
      '*Commands:*',
      '',
      '/check `<subclass>` — Check current processing times',
      '  Example: `/check 186`',
      '',
      '/subscribe `<subclass>` — Subscribe to a visa',
      '  Example: `/subscribe 186`',
      '',
      '/unsubscribe `<subclass>` — Unsubscribe from a visa',
      '  Example: `/unsubscribe 186`',
      '',
      '/list — Show your current subscriptions',
      '',
      'Data sourced from immi.homeaffairs.gov.au',
    ].join('\n')

    bot.sendMessage(chatId, welcome, { parse_mode: 'Markdown' })
  })
}
