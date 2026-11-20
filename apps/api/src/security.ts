import { lookup as defaultDnsLookup } from 'node:dns/promises'
import type { LookupAddress } from 'node:dns'
import { isIP } from 'node:net'
import { ProxyError } from './errors/proxy-error.js'

export type DnsLookupFn = (
  hostname: string,
  options: { all: true; verbatim: boolean },
) => Promise<LookupAddress[]>

export interface ValidateUrlOptions {
  lookup?: DnsLookupFn
  allowLocalhost?: boolean
}

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:'])
const BLOCKED_HOSTNAMES = new Set(['localhost', '0.0.0.0'])

function isPrivateIpv4Octets(a: number, b: number, c: number): boolean {
  if (a === 0) return true // 0.0.0.0/8 ("this" network)
  if (a === 10) return true // 10.0.0.0/8 (private)
  if (a === 100 && b >= 64 && b <= 127) return true // 100.64.0.0/10 (CGNAT)
  if (a === 127) return true // 127.0.0.0/8 (loopback)
  if (a === 169 && b === 254) return true // 169.254.0.0/16 (link-local / cloud metadata)
  if (a === 172 && b >= 16 && b <= 31) return true // 172.16.0.0/12 (private)
  if (a === 192 && b === 0 && c === 0) return true // 192.0.0.0/24 (IETF protocol)
  if (a === 192 && b === 168) return true // 192.168.0.0/16 (private)
  if (a === 198 && (b === 18 || b === 19)) return true // 198.18.0.0/15 (benchmarking)
  if (a >= 224) return true // 224.0.0.0/4 multicast + 240.0.0.0/4 reserved/broadcast

  return false
}

function isPrivateIpv4(ip: string): boolean {
  const parts = ip.split('.').map(Number)
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) {
    return true
  }

  return isPrivateIpv4Octets(parts[0], parts[1], parts[2])
}

function expandIpv6(rawIp: string): number[] | null {
  const ipWithoutZone = rawIp.split('%')[0].toLowerCase()

  let normalized = ipWithoutZone
  if (normalized.includes('.')) {
    const lastColon = normalized.lastIndexOf(':')
    if (lastColon === -1) return null

    const ipv4Part = normalized.slice(lastColon + 1)
    const octets = ipv4Part.split('.').map(Number)
    if (octets.length !== 4 || octets.some((n) => Number.isNaN(n) || n < 0 || n > 255)) {
      return null
    }

    const high = ((octets[0] << 8) | octets[1]).toString(16)
    const low = ((octets[2] << 8) | octets[3]).toString(16)
    normalized = `${normalized.slice(0, lastColon + 1)}${high}:${low}`
  }

  const doubleColonParts = normalized.split('::')
  if (doubleColonParts.length > 2) return null

  let groups: string[]
  if (doubleColonParts.length === 2) {
    const left = doubleColonParts[0] ? doubleColonParts[0].split(':') : []
    const right = doubleColonParts[1] ? doubleColonParts[1].split(':') : []
    const missing = 8 - left.length - right.length
    if (missing < 0) return null
    groups = [...left, ...Array<string>(missing).fill('0'), ...right]
  } else {
    groups = normalized.split(':')
  }

  if (groups.length !== 8) return null

  const words = groups.map((group) => Number.parseInt(group, 16))
  if (words.some((w) => Number.isNaN(w) || w < 0 || w > 0xffff)) {
    return null
  }

  return words
}

function isPrivateIpv6(ip: string): boolean {
  const words = expandIpv6(ip)
  if (!words) return true

  const allZeroPrefix = words.slice(0, 5).every((w) => w === 0)

  // :: (unspecified) e ::1 (loopback) e ::/96 (IPv4-compatible)
  if (allZeroPrefix && words[5] === 0) {
    if (words[6] === 0 && (words[7] === 0 || words[7] === 1)) {
      return true
    }
    return isPrivateIpv4Octets(words[6] >> 8, words[6] & 0xff, words[7] >> 8)
  }

  // ::ffff:0:0/96 (IPv4-mapped IPv6, ex.: ::ffff:127.0.0.1 ou ::ffff:7f00:1)
  if (allZeroPrefix && words[5] === 0xffff) {
    return isPrivateIpv4Octets(words[6] >> 8, words[6] & 0xff, words[7] >> 8)
  }

  // fc00::/7 (Unique Local Address)
  if ((words[0] & 0xfe00) === 0xfc00) return true

  // fe80::/10 (Link-Local) e fec0::/10 (Site-Local legado)
  if ((words[0] & 0xffc0) === 0xfe80 || (words[0] & 0xffc0) === 0xfec0) return true

  // ff00::/8 (Multicast)
  if ((words[0] & 0xff00) === 0xff00) return true

  // 2002::/16 (6to4 com IPv4 embutido)
  if (words[0] === 0x2002) {
    return isPrivateIpv4Octets(words[1] >> 8, words[1] & 0xff, words[2] >> 8)
  }

  return false
}

export function isPrivateIp(ip: string): boolean {
  const cleanIp = ip.split('%')[0]
  const family = isIP(cleanIp)

  if (family === 4) return isPrivateIpv4(cleanIp)
  if (family === 6) return isPrivateIpv6(cleanIp)

  // Se não for um IP reconhecido, bloqueia por segurança (fail-closed)
  return true
}

function normalizeHostname(rawHostname: string): string {
  const withoutBrackets =
    rawHostname.startsWith('[') && rawHostname.endsWith(']')
      ? rawHostname.slice(1, -1)
      : rawHostname

  return withoutBrackets.toLowerCase().replace(/\.+$/, '')
}

function isLoopbackHost(hostname: string): boolean {
  return (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname === '127.0.0.1' ||
    hostname === '::1'
  )
}

function isBlockedHostname(hostname: string): boolean {
  return (
    BLOCKED_HOSTNAMES.has(hostname) ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal')
  )
}

export async function validateTargetUrl(
  rawUrl: string,
  options: ValidateUrlOptions = {},
): Promise<URL> {
  let parsedUrl: URL
  try {
    parsedUrl = new URL(rawUrl)
  } catch {
    throw new ProxyError(400, 'URL inválida.', 'INVALID_URL')
  }

  if (!ALLOWED_PROTOCOLS.has(parsedUrl.protocol)) {
    throw new ProxyError(
      400,
      'Apenas os protocolos http e https são permitidos.',
      'INVALID_URL',
    )
  }

  const hostname = normalizeHostname(parsedUrl.hostname)
  if (!hostname) {
    throw new ProxyError(
      400,
      'Acesso a endereços de rede privados não é permitido.',
      'SSRF_BLOCKED',
    )
  }

  if (options.allowLocalhost && isLoopbackHost(hostname)) {
    return parsedUrl
  }

  if (isBlockedHostname(hostname)) {
    throw new ProxyError(
      400,
      'Acesso a endereços de rede privados não é permitido.',
      'SSRF_BLOCKED',
    )
  }

  if (isIP(hostname) !== 0) {
    if (isPrivateIp(hostname)) {
      throw new ProxyError(
        400,
        'Acesso a endereços de rede privados não é permitido.',
        'SSRF_BLOCKED',
      )
    }
    return parsedUrl
  }

  const dnsLookup: DnsLookupFn = options.lookup ?? defaultDnsLookup
  let addresses: LookupAddress[]

  try {
    addresses = await dnsLookup(hostname, { all: true, verbatim: true })
  } catch {
    throw new ProxyError(
      400,
      'Não foi possível resolver o domínio informado.',
      'DNS_RESOLUTION_FAILED',
    )
  }

  if (addresses.length === 0 || addresses.some((entry) => isPrivateIp(entry.address))) {
    throw new ProxyError(
      400,
      'Acesso a endereços de rede privados não é permitido.',
      'SSRF_BLOCKED',
    )
  }

  return parsedUrl
}