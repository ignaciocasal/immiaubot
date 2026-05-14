declare module 'node-telegram-bot-api' {
  interface Message {
    message_id: number
    chat: { id: number }
    text?: string
  }

  interface SendMessageOptions {
    parse_mode?: string
  }

  class TelegramBot {
    constructor(token: string, options?: { polling?: boolean })
    onText(regexp: RegExp, callback: (msg: Message, match: RegExpExecArray | null) => void): void
    on(event: string, listener: (msg: Message) => void): this
    sendMessage(chatId: number, text: string, options?: SendMessageOptions): Promise<Message>
  }

  export = TelegramBot
}
