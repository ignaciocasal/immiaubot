declare module 'node-telegram-bot-api' {
  interface Message {
    message_id: number
    chat: { id: number }
    text?: string
  }

  interface CallbackQuery {
    id: string
    message?: Message
    data?: string
  }

  interface InlineKeyboardButton {
    text: string
    callback_data?: string
    url?: string
  }

  interface InlineKeyboardMarkup {
    inline_keyboard: InlineKeyboardButton[][]
  }

  interface SendMessageOptions {
    parse_mode?: string
    reply_markup?: InlineKeyboardMarkup
  }

  interface EditMessageTextOptions {
    chat_id: number
    message_id: number
    parse_mode?: string
    reply_markup?: InlineKeyboardMarkup
  }

  interface BotCommand {
    command: string
    description: string
  }

  class TelegramBot {
    constructor(token: string, options?: { polling?: boolean })
    onText(regexp: RegExp, callback: (msg: Message, match: RegExpExecArray | null) => void): void
    on(event: string, listener: (msg: Message | CallbackQuery) => void): this
    sendMessage(chatId: number, text: string, options?: SendMessageOptions): Promise<Message>
    editMessageText(text: string, options: EditMessageTextOptions): Promise<Message>
    answerCallbackQuery(callbackQueryId: string): Promise<boolean>
    setMyCommands(commands: BotCommand[]): Promise<boolean>
  }

  export = TelegramBot
}
