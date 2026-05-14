import { VisaStream } from '../../types'

export function buildStreamOptions(streams: VisaStream[]): string {
  return streams
    .map((s, i) => `${i + 1}. ${s.streamName}`)
    .join('\n')
}

export function parseStreamChoice(text: string, streams: VisaStream[]): VisaStream | null {
  const num = parseInt(text, 10)
  if (isNaN(num) || num < 1 || num > streams.length) return null
  return streams[num - 1] ?? null
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
