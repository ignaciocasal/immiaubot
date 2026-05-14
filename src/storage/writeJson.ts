import { atomicWrite } from './atomicWrite'

export function writeJson(filePath: string, data: unknown): void {
  atomicWrite(filePath, JSON.stringify(data, null, 2) + '\n')
}
