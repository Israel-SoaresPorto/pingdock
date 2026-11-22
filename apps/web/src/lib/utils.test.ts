import { describe, it, expect } from "vitest";
import { isValidJson } from "./utils";

describe("utils", () => {
  describe("isValidJson", () => {
    it("deve retornar true para JSON válido", () => {
      expect(isValidJson('{"key": "value"}')).toBe(true);
    });

    it("deve retornar false para JSON inválido", () => {
      expect(isValidJson('{"key": "value"')).toBe(false);
    });

    it("deve retornar true para string vazia", () => {
      expect(isValidJson("")).toBe(true);
    });
  });
});
