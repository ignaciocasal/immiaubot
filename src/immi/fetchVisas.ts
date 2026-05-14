import axios from 'axios'
import { config } from '../config'
import { ApiResponse, VisaListRow } from '../types'

const VISA_LIST_URL =
  'https://immi.homeaffairs.gov.au/Visa-subsite/_layouts/15/api/GPT.aspx/GetProcessGuideVisas'

export async function fetchVisas(): Promise<VisaListRow[]> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < config.maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        await new Promise((r) => setTimeout(r, config.retryDelays[attempt - 1] ?? 1000))
      }

      const res = await axios.post<ApiResponse<VisaListRow>>(VISA_LIST_URL, {}, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000,
      })

      const data = res.data?.d?.data
      if (!data || !Array.isArray(data)) {
        throw new Error('Invalid visa list response structure')
      }

      return data
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      console.warn(`fetchVisas attempt ${attempt + 1} failed:`, lastError.message)
    }
  }

  throw lastError ?? new Error('Failed to fetch visa list')
}
