import { describe, expect, it } from "vitest";
import { useHistory } from "./use-history";
import { act, renderHook } from "@testing-library/react";

describe("useHistory", () => {
  it("adiciona uma nova entrada ao histórico", () => {
    const { result } = renderHook(() => useHistory());

    act(() => {
      result.current.addEntry({
        url: "https://api.example.com/data",
        method: "GET",
        headers: [],
        body: "",
        status: 200,
        durationMs: 150,
      });
    });

    expect(result.current.history.length).toBe(1);
    expect(result.current.history[0].url).toBe("https://api.example.com/data");
  });

  it("remove uma entrada do histórico", () => {
    const { result } = renderHook(() => useHistory());

    act(() => {
      const newEntry = result.current.addEntry({
        url: "https://api.example.com/data",
        method: "GET",
        headers: [],
        body: "",
        status: 200,
        durationMs: 150,
      });

      result.current.removeEntry(newEntry.id);
    });

    expect(result.current.history.length).toBe(0);
  });

  it("limpa o histórico", () => {
    const { result } = renderHook(() => useHistory());

    act(() => {
      result.current.addEntry({
        url: "https://api.example.com/data",
        method: "GET",
        headers: [],
        body: "",
        status: 200,
        durationMs: 150,
      });

      result.current.clearHistory();
    });

    expect(result.current.history.length).toBe(0);
  });
});