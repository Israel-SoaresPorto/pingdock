export { cn } from "cn"

export function isValidJson(raw: string): boolean {
  if (raw.trim().length === 0) return true
  try {
    JSON.parse(raw)
    return true
  } catch {
    return false
  }
}