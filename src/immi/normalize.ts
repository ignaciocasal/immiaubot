import { VisaEstimate, VisaStream, VisaListRow, VisaEstimateRow } from '../types'

function toNum(val: string | null | undefined): number | null {
  if (val === null || val === undefined || val === '') return null
  const n = Number(val)
  return isNaN(n) ? null : n
}

export function normalizeVisas(rows: VisaListRow[]): Record<string, VisaStream[]> {
  const catalog: Record<string, VisaStream[]> = {}

  for (const row of rows) {
    const code = row.VisaSubclassCode
    if (!code) continue

    if (!catalog[code]) catalog[code] = []

    catalog[code].push({
      key: `${code}:${row.StreamCode ?? ''}`,
      streamName: row.StreamText || 'Main',
    })
  }

  return catalog
}

export function normalizeEstimate(row: VisaEstimateRow): VisaEstimate {
  return {
    visaName: row.VisaSubclassText ?? '',
    streamName: row.StreamText ?? '',
    subclassCode: row.VisaSubclassCode ?? '',
    streamCode: row.StreamCode ?? '',
    p90Days: toNum(row.Percent90),
    p90Text: row.Percent90Text ?? null,
    updatedAt: new Date().toISOString().slice(0, 10),
  }
}
