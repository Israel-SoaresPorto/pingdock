import { describe, beforeEach, afterEach, it, expect, vi } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import { rateLimitPlugin } from "./rate-limit.js";

describe("rate limit plugin", () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    vi.useFakeTimers();
    app = Fastify();
  });

  afterEach(async () => {
    await app.close();
    vi.useRealTimers();
  });

  it("deve limitar o número de requisições por IP", async () => {
    await app.register(rateLimitPlugin, { max: 2, timeWindow: "1 minute" });

    app.get("/test", async () => {
      return { message: "OK" };
    });

    const response1 = await app.inject({
      method: "GET",
      url: "/test",
    });

    const response2 = await app.inject({
      method: "GET",
      url: "/test",
    });

    const response3 = await app.inject({
      method: "GET",
      url: "/test",
    });

    expect(response1.statusCode).toBe(200);
    expect(response2.statusCode).toBe(200);
    expect(response3.statusCode).toBe(429);
  });

  it("deve permitir configurar o número máximo de requisições", async () => {
    await app.register(rateLimitPlugin, { max: 3, timeWindow: "1 minute" });

    app.get("/test", async () => {
      return { message: "OK" };
    });

    for (let i = 0; i < 3; i++) {
      await app.inject({
        method: "GET",
        url: "/test",
      });
    }

    const response = await app.inject({
      method: "GET",
      url: "/test",
    });

    expect(response.statusCode).toBe(429);
  });

  it("deve permitir configurar a janela de tempo para o limite", async () => {
    await app.register(rateLimitPlugin, { max: 2, timeWindow: "2 minute" });

    app.get("/test", async () => {
      return { message: "OK" };
    });

    for (let i = 0; i < 2; i++) {
      await app.inject({
        method: "GET",
        url: "/test",
      });
    }

    const response1 = await app.inject({
      method: "GET",
      url: "/test",
    });

    expect(response1.statusCode).toBe(429);

    // Aguarda 1 minuto para que o limite seja resetado
    vi.advanceTimersByTime(120000);

    const response2 = await app.inject({
      method: "GET",
      url: "/test",
    });

    expect(response2.statusCode).toBe(200);
  });
});
