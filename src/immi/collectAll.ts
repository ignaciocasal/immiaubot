import path from 'path'
import { config } from '../config'
import { fetchVisas } from './fetchVisas'
import { fetchEstimate } from './fetchEstimate'
import { normalizeVisas, normalizeEstimate } from './normalize'
import { writeJson } from '../storage/writeJson'
import { readJson } from '../storage/readJson'
import { VisaEstimate } from '../types'

export async function collectAll(): Promise<void> {
  console.log('Fetching visa list...')
  const rawVisas = await fetchVisas()
  const catalog = normalizeVisas(rawVisas)
  const visasPath = path.join(config.dataDir, 'visas.json')
  writeJson(visasPath, catalog)
  console.log(`Saved ${Object.keys(catalog).length} visa subclasses to visas.json`)

  const estimates: Record<string, VisaEstimate> = {}
  const total = Object.values(catalog).reduce((sum, streams) => sum + streams.length, 0)
  let count = 0

  for (const [subclassCode, streams] of Object.entries(catalog)) {
    for (const stream of streams) {
      const [, streamCode] = stream.key.split(':')
      count++
      console.log(`[${count}/${total}] Fetching ${subclassCode}:${streamCode}...`)

      try {
        const raw = await fetchEstimate(subclassCode, streamCode)
        estimates[stream.key] = normalizeEstimate(raw)
      } catch (err) {
        console.error(`Failed to fetch ${stream.key}, skipping:`, (err as Error).message)
      }

      await new Promise((r) => setTimeout(r, config.requestDelayMs))
    }
  }

  const latestPath = path.join(config.dataDir, 'latest.json')
  writeJson(latestPath, estimates)
  console.log(`Saved ${Object.keys(estimates).length} estimates to latest.json`)
}
