import type { FastifyInstance } from "fastify";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildApp } from "./app.js";
import type { DnsLookupFn } from "./security.js";

const publicLookup: DnsLookupFn = async () => [
  { address: "93.184.216.34", family: 4 },
];

describe("POST /api/proxy", () => {
  let app: FastifyInstance | undefined;

  afterEach(async () => {
    vi.unstubAllGlobals();
    if (app) {
      await app.close();
      app = undefined;
    }
  });

  it("responde ok no GET /health", async () => {
    app = await buildApp({ fastify: { logger: false } });

    const response = await app.inject({ method: "GET", url: "/health" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "ok" });
  });

  it("retorna 400 quando o payload viola o JSON Schema", async () => {
    app = await buildApp({
      fastify: { logger: false },
      proxy: { lookup: publicLookup },
    });

    const response = await app.inject({
      method: "POST",
      url: "/api/proxy",
      payload: {
        method: "TRACE",
        url: "https://example.com",
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toHaveProperty("error");
  });

  it("bloqueia SSRF com 400 sem chamar fetch", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    app = await buildApp({
      fastify: { logger: false },
      proxy: { lookup: publicLookup },
    });

    const response = await app.inject({
      method: "POST",
      url: "/api/proxy",
      payload: {
        method: "GET",
        url: "http://169.254.169.254/latest/meta-data/",
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error: "Acesso a endereços de rede privados não é permitido.",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("encaminha POST com JSON, filtra headers hop-by-hop e retorna 200", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: 101, title: "Teste" }), {
        status: 201,
        statusText: "Created",
        headers: { "content-type": "application/json; charset=utf-8" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    app = await buildApp({
      fastify: { logger: false },
      proxy: { lookup: publicLookup },
    });

    const response = await app.inject({
      method: "POST",
      url: "/api/proxy",
      payload: {
        method: "POST",
        url: "https://jsonplaceholder.typicode.com/posts",
        headers: {
          Host: "evil.internal",
          "Content-Length": "9999",
          "X-Custom": "pingdock",
        },
        body: { title: "Teste" },
      },
    });

    expect(response.statusCode).toBe(200);

    const json = response.json();
    expect(json.status).toBe(201);
    expect(json.statusText).toBe("Created");
    expect(typeof json.durationMs).toBe("number");
    expect(json.headers["content-type"]).toContain("application/json");
    expect(json.data).toEqual({ id: 101, title: "Teste" });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://jsonplaceholder.typicode.com/posts",
      expect.objectContaining({
        method: "POST",
        redirect: "manual",
        body: JSON.stringify({ title: "Teste" }),
        headers: {
          "X-Custom": "pingdock",
          "content-type": "application/json",
        },
      }),
    );
  });

  it("encapsula 404/500 da API externa em 200 OK", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("Not Found", {
          status: 404,
          statusText: "Not Found",
          headers: { "content-type": "text/plain" },
        }),
      ),
    );

    app = await buildApp({
      fastify: { logger: false },
      proxy: { lookup: publicLookup },
    });

    const response = await app.inject({
      method: "POST",
      url: "/api/proxy",
      payload: {
        method: "GET",
        url: "https://api.example.com/missing",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      status: 404,
      statusText: "Not Found",
      data: "Not Found",
    });
  });

  it("trata resposta vazia 204 No Content sem erro", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 204 })),
    );

    app = await buildApp({
      fastify: { logger: false },
      proxy: { lookup: publicLookup },
    });

    const response = await app.inject({
      method: "POST",
      url: "/api/proxy",
      payload: {
        method: "DELETE",
        url: "https://api.example.com/items/1",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      status: 204,
      data: null,
    });
  });

  it("retorna 504 em caso de timeout", async () => {
    const timeoutError = new Error("The operation was aborted due to timeout");
    timeoutError.name = "TimeoutError";
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(timeoutError));

    app = await buildApp({
      fastify: { logger: false },
      proxy: { lookup: publicLookup, timeoutMs: 10_000 },
    });

    const response = await app.inject({
      method: "POST",
      url: "/api/proxy",
      payload: {
        method: "GET",
        url: "https://slow.example.com",
      },
    });

    expect(response.statusCode).toBe(504);
    expect(response.json()).toHaveProperty("error");
  });

  it("retorna 429 ao exceder o rate limit sem afetar /health", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(
        async () =>
          new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { "content-type": "application/json" },
          }),
      ),
    );

    app = await buildApp({
      fastify: { logger: false },
      proxy: {
        lookup: publicLookup,
        rateLimit: { max: 2, timeWindow: "1 minute" },
      },
    });

    const payload = { method: "GET", url: "https://api.example.com/ping" };

    const first = await app.inject({
      method: "POST",
      url: "/api/proxy",
      payload,
    });
    const second = await app.inject({
      method: "POST",
      url: "/api/proxy",
      payload,
    });
    const third = await app.inject({
      method: "POST",
      url: "/api/proxy",
      payload,
    });
    const health = await app.inject({ method: "GET", url: "/health" });

    expect(first.statusCode).toBe(200);
    expect(second.statusCode).toBe(200);
    expect(third.statusCode).toBe(429);
    expect(third.json()).toHaveProperty("error");
    expect(health.statusCode).toBe(200);
  });

  it("permite chamada para localhost quando proxy.allowLocalhost está ativo", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        statusText: "OK",
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    app = await buildApp({
      fastify: { logger: false },
      proxy: { allowLocalhost: true },
    });

    const response = await app.inject({
      method: "POST",
      url: "/api/proxy",
      payload: {
        method: "GET",
        url: "http://localhost:8080/users",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      status: 200,
      data: { ok: true },
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
