import Fastify, { type FastifyInstance } from "fastify";
import { describe, beforeEach, afterEach, it, expect } from "vitest";
import { errorHandlerPlugin } from "./error-handler.js";
import { ProxyError } from "../errors/proxy-error.js";

describe("error handler plugin", () => {
    let app: FastifyInstance;

    beforeEach(async () => {
        app = Fastify();
        await app.register(errorHandlerPlugin);
    });

    afterEach(async () => {
        await app.close();
    });

    it("deve tratar erros do tipo ProxyError corretamente", async () => {
        app.get("/proxy-error", async () => {
            throw new ProxyError(400, "Invalid URL", "INVALID_URL");
        });

        const response = await app.inject({
            method: "GET",
            url: "/proxy-error",
        });

        expect(response.statusCode).toBe(400);
        expect(response.json()).toEqual({ error: "Invalid URL" });
    });

    it("deve tratar erros de validação corretamente", async () => {
        app.post("/validation-error", async () => {
            throw new Error("Validation failed");
        });

        const response = await app.inject({
            method: "POST",
            url: "/validation-error",
            payload: {},
        });

        expect(response.statusCode).toBe(500);
        expect(response.json()).toHaveProperty("error");
    });

    it("deve tratar erros de corpo da requisição muito grande corretamente", async () => {
        app.post("/body-too-large", async () => {
            throw new Error("Request body too large");
        });

        const response = await app.inject({
            method: "POST",
            url: "/body-too-large",
            payload: "a".repeat(1024 * 1024 + 1), // 1 MB + 1 byte
        });

        expect(response.statusCode).toBe(415);
        expect(response.json()).toEqual({ error: "Unsupported Media Type" });
    });
});