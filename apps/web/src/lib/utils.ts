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

export function getStatusBadgeClass(status: number): string {
  if (status >= 200 && status < 300) {
    return "bg-status-success-bg text-status-success-text";
  }
  if (status >= 300 && status < 400) {
    return "bg-status-info-bg text-status-info-text";
  }
  if (status >= 400 && status < 500) {
    return "bg-status-warning-bg text-status-warning-text";
  }
  return "bg-status-error-bg text-status-error-text";
}

export function formatHostAndPath(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    return `${parsed.host}${parsed.pathname}${parsed.search}`;
  } catch {
    return rawUrl;
  }
}

export function formatHistoryTimestamp(timestamp: number): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}