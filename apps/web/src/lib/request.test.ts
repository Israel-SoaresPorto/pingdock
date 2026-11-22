import { describe, expect, it } from "vitest";
import type { HeaderItem } from "../types/app";
import { buildHeadersRecord } from "./request";

describe("types", () => {
  describe("toHeadersRecord", () => {
    it("Converte HeaderItem[] para Record<string, string>", () => {
      const input: HeaderItem[] = [
        {
          id: "1",
          key: "Content-Type",
          value: "application/json",
          enabled: true,
        },
        { id: "2", key: "Authorization", value: "Bearer token", enabled: true },
      ];
      const expectedOutput = {
        "Content-Type": "application/json",
        Authorization: "Bearer token",
      };
      const output = buildHeadersRecord(input);
      expect(output).toEqual(expectedOutput);
    });
  });

  it("Ignora linhas desativadas ou com chave vazia", () => {
    const input: HeaderItem[] = [
      {
        id: "1",
        key: "Content-Type",
        value: "application/json",
        enabled: true,
      },
      { id: "2", key: "", value: "Bearer token", enabled: true },
      { id: "3", key: "X-Custom-Header", value: "value", enabled: false },
    ];
    const expectedOutput = {
      "Content-Type": "application/json",
    };
    const output = buildHeadersRecord(input);
    expect(output).toEqual(expectedOutput);
  });
});
