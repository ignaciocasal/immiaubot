import { VisaStream } from '../../types'

interface InlineKeyboardButton {
  text: string
  callback_data: string
}

interface InlineKeyboardMarkup {
  inline_keyboard: InlineKeyboardButton[][]
}

export function formatVisaEstimate(
  visaName: string,
  streamName: string,
  p90: string | null
): string {
  const lines = [`*${visaName}*`, streamName ? `_${streamName}_` : '', '']
  if (p90) lines.push(`90%: ${p90}`)
  return lines.join('\n')
}

export function buildStreamKeyboard(
  streams: VisaStream[],
  actionPrefix: 'cs' | 'ss' | 'us'
): InlineKeyboardMarkup {
  const rows: InlineKeyboardButton[][] = streams.map(s => [{
    text: s.streamName,
    callback_data: `${actionPrefix}:${s.key}`,
  }])
  return { inline_keyboard: rows }
}

export function displaySubclass(subclass: string): string {
  return subclass.endsWith('-1') ? subclass.slice(0, -2) : subclass
}

export function resolveSubclass(
  input: string,
  visas: Record<string, VisaStream[]>
): string | null {
  const upper = input.toUpperCase()
  if (visas[upper]) return upper
  const withDash = `${upper}-1`
  if (visas[withDash]) return withDash
  return null
}
