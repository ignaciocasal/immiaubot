import { VisaEstimate, Change } from '../types'

export function detectChanges(
  previous: Record<string, VisaEstimate>,
  current: Record<string, VisaEstimate>
): Change[] {
  const changes: Change[] = []

  for (const [key, curr] of Object.entries(current)) {
    const prev = previous[key]
    if (!prev) continue

    if (prev.p90Days !== curr.p90Days) {
      changes.push({
        key,
        visaName: curr.visaName,
        streamName: curr.streamName,
        changes: [
          {
            percentile: '90%',
            from: prev.p90Days,
            to: curr.p90Days,
            fromText: prev.p90Text,
            toText: curr.p90Text,
          },
        ],
      })
    }
  }

  return changes
}
