export interface VisaStream {
  key: string
  streamName: string
}

export interface VisaEstimate {
  visaName: string
  streamName: string
  subclassCode: string
  streamCode: string
  p90Days: number | null
  p90Text: string | null
  updatedAt: string
}

export interface Subscriptions {
  [chatId: string]: string[]
}

export interface Change {
  key: string
  visaName: string
  streamName: string
  changes: {
    percentile: string
    from: number | null
    to: number | null
    fromText: string | null
    toText: string | null
  }[]
}

export interface TempSelection {
  chatId: number
  subclassCode: string
  visaKey: string | null
  step: 'awaiting_stream_choice' | 'complete'
}

export interface VisaListRow {
  VisaSubclassText: string
  VisaSubclassCode: string
  StreamCode: string
  StreamText: string
}

export interface VisaEstimateRow {
  VisaSubclassText: string
  VisaSubclassCode: string
  StreamCode: string
  StreamText: string
  Percent25: string | null
  Percent50: string | null
  Percent75: string | null
  Percent90: string | null
  Percent25Text: string | null
  Percent50Text: string | null
  Percent75Text: string | null
  Percent90Text: string | null
  ProcessGuideMaxDays?: string
  ProcessGuideInfo?: string
  VisaUrl?: string
}

export interface ApiResponse<T = unknown> {
  d?: {
    __type?: string
    success?: boolean
    data?: T[]
    message?: string | null
  }
}
