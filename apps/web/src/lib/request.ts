import type { HeaderItem } from "../types/app"

/**
 * Converte a lista de headers da UI para o formato aceito por POST /api/proxy,
 * ignorando linhas desativadas ou com chave vazia.
 */
export function buildHeadersRecord(items: HeaderItem[]): Record<string, string> {
  const result: Record<string, string> = {}
  
  for (const item of items) {
    const trimmedKey = item.key.trim()
    if (!item.enabled || trimmedKey.length === 0) {
      continue;
    }
    
    result[trimmedKey] = item.value
  }
  return result
}