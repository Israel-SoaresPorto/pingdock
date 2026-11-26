import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import useLocalStorage from "./use-local-storage";

describe("useLocalStorage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("adiciona um valor ao localStorage", () => {
    const { result } = renderHook(() => useLocalStorage("theme", "light"));

    act(() => {
      result.current.setValue("dark");
    });

    expect(result.current.storedValue).toBe("dark");
    expect(window.localStorage.setItem).toHaveBeenCalledWith(
      "theme",
      JSON.stringify("dark"),
    );
  });

  it("retorna o valor inicial se não houver valor no localStorage", () => {
    localStorage.removeItem("theme");
    
    const { result } = renderHook(() => useLocalStorage("theme", "light"));

    expect(result.current.storedValue).toBe("light");
  });

  it("lida com chaves ausentes no localStorage", () => {
    const { result } = renderHook(() =>
      useLocalStorage("missing-key", "default"),
    );

    expect(result.current.storedValue).toBe("default");
  });

  it("lida com serialização e desserialização de objetos", () => {
    window.localStorage.setItem(
      "preferences",
      JSON.stringify({ compact: true }),
    );

    const { result } = renderHook(() =>
      useLocalStorage("preferences", { compact: false }),
    );

    expect(result.current.storedValue).toEqual({ compact: true });

    act(() => {
      result.current.setValue({ compact: false });
    });

    expect(window.localStorage.setItem).toHaveBeenCalledWith(
      "preferences",
      JSON.stringify({ compact: false }),
    );
  });
});