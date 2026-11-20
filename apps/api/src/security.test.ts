import { describe, expect, it, vi } from "vitest";
import { ProxyError } from "./errors/proxy-error.js";
import {
  isPrivateIp,
  validateTargetUrl,
  type DnsLookupFn,
} from "./security.js";

describe("isPrivateIp", () => {
  it.each([
    "0.0.0.0",
    "127.0.0.1",
    "127.255.255.254",
    "10.0.0.1",
    "172.16.0.1",
    "172.31.255.255",
    "192.168.1.1",
    "169.254.169.254",
    "100.64.0.1",
    "224.0.0.1",
    "::",
    "::1",
    "fc00::1",
    "fd12:3456::1",
    "fe80::1",
    "fe80::1%eth0",
    "::ffff:127.0.0.1",
    "::ffff:7f00:1",
    "::ffff:169.254.169.254",
    "not-an-ip",
  ])("bloqueia IP privado/reservado: %s", (ip) => {
    expect(isPrivateIp(ip)).toBe(true);
  });

  it.each([
    "1.1.1.1",
    "8.8.8.8",
    "93.184.216.34",
    "172.15.255.255",
    "172.32.0.1",
    "2606:4700:4700::1111",
  ])("permite IP público: %s", (ip) => {
    expect(isPrivateIp(ip)).toBe(false);
  });
});

describe("validateTargetUrl", () => {
  it.each([
    "not-a-url",
    "file:///etc/passwd",
    "ftp://example.com/file.txt",
    "javascript:alert(1)",
  ])("rejeita URL ou protocolo inválido: %s", async (url) => {
    await expect(validateTargetUrl(url)).rejects.toThrow(ProxyError);
  });

  it.each([
    "http://localhost:3001",
    "http://api.localhost",
    "http://localhost./test",
    "http://127.0.0.1:3001",
    "http://169.254.169.254/latest/meta-data/",
    "http://[::1]:3000",
    "http://[::ffff:127.0.0.1]/admin",
  ])(
    "bloqueia destinos locais/privados antes de consultar DNS: %s",
    async (url) => {
      const lookup = vi.fn<DnsLookupFn>();

      await expect(validateTargetUrl(url, { lookup })).rejects.toMatchObject({
        statusCode: 400,
        code: "SSRF_BLOCKED",
      });
      expect(lookup).not.toHaveBeenCalled();
    },
  );

  it("bloqueia domínio cujo DNS retorna ao menos um IP privado", async () => {
    const lookup: DnsLookupFn = async () => [
      { address: "93.184.216.34", family: 4 },
      { address: "10.0.0.5", family: 4 },
    ];

    await expect(
      validateTargetUrl("https://dual-dns.example.com", { lookup }),
    ).rejects.toMatchObject({
      statusCode: 400,
      code: "SSRF_BLOCKED",
    });
  });

  it("retorna 400 quando o DNS falha", async () => {
    const lookup: DnsLookupFn = async () => {
      throw new Error("ENOTFOUND");
    };

    await expect(
      validateTargetUrl("https://nao-existe.invalid", { lookup }),
    ).rejects.toMatchObject({
      statusCode: 400,
      code: "DNS_RESOLUTION_FAILED",
    });
  });

  it("permite domínio que resolve apenas para IPs públicos", async () => {
    const lookup: DnsLookupFn = async () => [
      { address: "93.184.216.34", family: 4 },
    ];

    const url = await validateTargetUrl(
      "https://jsonplaceholder.typicode.com/posts",
      {
        lookup,
      },
    );

    expect(url.href).toBe("https://jsonplaceholder.typicode.com/posts");
  });
});

describe("validateTargetUrl com allowLocalhost true", () => {
  it.each([
    "http://localhost:8080/users",
    "http://api.localhost:3000/items",
    "http://127.0.0.1:8080/health",
    "http://[::1]:8080/health",
  ])("permite loopback quando allowLocalhost é true: %s", async (url) => {
    const lookup = vi.fn<DnsLookupFn>();

    const parsed = await validateTargetUrl(url, {
      lookup,
      allowLocalhost: true,
    });

    expect(parsed.href).toBe(url);
    expect(lookup).not.toHaveBeenCalled();
  });

  it("mantém metadata e IPs privados bloqueados mesmo com allowLocalhost true", async () => {
    await expect(
      validateTargetUrl("http://169.254.169.254/latest/meta-data/", {
        allowLocalhost: true,
      }),
    ).rejects.toMatchObject({
      statusCode: 400,
      code: "SSRF_BLOCKED",
    });
  });
});
