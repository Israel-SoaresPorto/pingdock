import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import useClientRequest from "./use-client-request";

describe("useClientRequest", () => {
  it("realiza uma requisição bem-sucedida", async () => {
    const mockResponse = {
      status: 200,
      statusText: "OK",
      durationMs: 123,
      headers: {
        "Content-Type": "application/json",
      },
      data: { message: "Success" },
    };

    const fetchMock = vi.mocked(globalThis.fetch);
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    } as Response);

    const { result } = renderHook(() => useClientRequest());

    await act(async () => {
      await result.current.request("https://example.com", "GET", [], "");
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/proxy", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        method: "GET",
        url: "https://example.com",
        headers: {},
      }),
    });
    expect(result.current.response).toEqual(mockResponse);
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it("lida com erro de JSON inválido", async () => { 
    const { result } = renderHook(() => useClientRequest());

    await act(async () => {
      await result.current.request("https://example.com", "POST", [], "{ invalid json }");
    });

    expect(result.current.response).toBeNull();
    expect(result.current.error).toEqual({
      status: 400,
      message: "O corpo da requisição contém JSON inválido.",
    });
    expect(result.current.isLoading).toBe(false);
  });

  it("lida com erros de conexão", async () => {
    const fetchMock = vi.mocked(globalThis.fetch);
    fetchMock.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useClientRequest());

    await act(async () => {
      await result.current.request("https://example.com", "GET", [], "");
    });

    expect(result.current.response).toBeNull();
    expect(result.current.error).toEqual({
      message: "Não foi possível conectar ao servidor proxy.",
    });
    expect(result.current.isLoading).toBe(false);
  });

  it("lida com erros de requisição", async () => {
    const mockErrorResponse = {
      status: 400,
      error: "Bad Request",
    };

    const fetchMock = vi.mocked(globalThis.fetch);
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => mockErrorResponse,
    } as Response);

    const { result } = renderHook(() => useClientRequest());

    await act(async () => {
      await result.current.request("https://example.com", "GET", [], "");
    });

    expect(result.current.response).toBeNull();
    expect(result.current.error).toEqual({
      status: 500,
      message: "Bad Request",
    });
    expect(result.current.isLoading).toBe(false);
  });
});