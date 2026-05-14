import { writeFileSync, renameSync, existsSync, mkdirSync } from 'fs'
import { dirname } from 'path'

export function atomicWrite(filePath: string, data: string): void {
  const dir = dirname(filePath)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  const tmp = filePath + '.tmp'
  writeFileSync(tmp, data, 'utf-8')
  renameSync(tmp, filePath)
}
