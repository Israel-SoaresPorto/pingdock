import { describe, expect, it } from "vitest";
import type { HeaderItem } from "../types/app";
import { toHeadersRecord } from "./types";

describe("types", () => {
  describe("toHeadersRecord", () => {
    it("Converte HeaderItem[] para Record<string, string>", () => {
        const input : HeaderItem[] = [
            { id: "1", key: "Content-Type", value: "application/json" },
            { id: "2", key: "Authorization", value: "Bearer token" },
        ];
        const expectedOutput = {
            "Content-Type": "application/json",
            "Authorization": "Bearer token",
        };
        const output = toHeadersRecord(input);
        expect(output).toEqual(expectedOutput); 
    });
  });
});
