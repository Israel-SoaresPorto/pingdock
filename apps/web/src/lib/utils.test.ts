import { describe, it, expect } from "vitest";
import { isValidJson, getStatusBadgeClass, formatHostAndPath, formatHistoryTimestamp } from "./utils";

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

  describe("getStatusBadgeClass", () => {
    it.each([
      [200, "bg-status-success-bg text-status-success-text"],
      [300, "bg-status-info-bg text-status-info-text"],
      [400, "bg-status-warning-bg text-status-warning-text"],
      [500, "bg-status-error-bg text-status-error-text"],
    ])(
      "deve retornar a classe correta para status %i",
      (status, expectedClass) => {
        expect(getStatusBadgeClass(status)).toBe(expectedClass);
      },
    );
  });

  describe("formatHostAndPath", () => {
    it("deve retornar host e path para URL válida", () => {
      expect(formatHostAndPath("https://example.com/path?query=1")).toBe(
        "example.com/path?query=1",
      );
    });

    it("deve retornar a string original para URL inválida", () => {
      expect(formatHostAndPath("invalid-url")).toBe("invalid-url");
    });
  });

  describe("formatHistoryTimestamp", () => {
    it("deve formatar o timestamp corretamente", () => {
      const timestamp = new Date("2024-01-01T12:34:56Z").getTime();
      expect(formatHistoryTimestamp(timestamp)).toBe("01/01, 09:34");
    });
  });
});
