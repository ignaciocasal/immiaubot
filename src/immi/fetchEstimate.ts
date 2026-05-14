import axios from 'axios'
import { config } from '../config'
import { ApiResponse, VisaEstimateRow } from '../types'

const ESTIMATE_URL =
  'https://immi.homeaffairs.gov.au/_layouts/15/api/GPT.aspx/GetProcessGuideInfo'

export async function fetchEstimate(
  subclassCode: string,
  streamCode: string
): Promise<VisaEstimateRow> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < config.maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        await new Promise((r) => setTimeout(r, config.retryDelays[attempt - 1] ?? 1000))
      }

      const res = await axios.post<ApiResponse<VisaEstimateRow>>(
        ESTIMATE_URL,
        {
          gptRequest: {
            VisaSubclassCode: subclassCode,
            StreamCode: streamCode,
          },
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 15000,
        }
      )

      const data = res.data?.d?.data
      if (!data || !Array.isArray(data) || data.length === 0) {
        throw new Error(`Invalid estimate response for ${subclassCode}:${streamCode}`)
      }

      return data[0]
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      console.warn(
        `fetchEstimate ${subclassCode}:${streamCode} attempt ${attempt + 1} failed:`,
        lastError.message
      )
    }
  }

  throw lastError ?? new Error(`Failed to fetch estimate for ${subclassCode}:${streamCode}`)
}
