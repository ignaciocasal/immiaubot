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

export function buildSubclassKeyboard(
  subclasses: string[],
  actionPrefix: 'ck' | 'sb' | 'uv'
): InlineKeyboardMarkup {
  const rows: InlineKeyboardButton[][] = []
  const cols = 4
  for (let i = 0; i < subclasses.length; i += cols) {
    rows.push(
      subclasses.slice(i, i + cols).map(sc => ({
        text: sc,
        callback_data: `${actionPrefix}:${sc}`,
      }))
    )
  }
  return { inline_keyboard: rows }
}

export function getPopularSubclasses(visas: Record<string, unknown>): string[] {
  const popular = ['186', '189', '190', '482', '485', '491', '500', '600']
  return popular.filter(sc => visas[sc] || visas[`${sc}-1`])
}
