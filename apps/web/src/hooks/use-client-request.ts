import { useState } from "react";
import type { HeaderItem, HttpMethod, ProxyRequestError } from "@/types/app";
import type {
  ProxyErrorResponse,
  ProxyRequestPayload,
  ProxyResponse,
} from "@/types/api";
import { buildHeadersRecord } from "@/lib/request";

export default function useClientRequest() {
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<ProxyResponse | null>(null);
  const [error, setError] = useState<ProxyRequestError | null>(null);

  async function request(
    url: string,
    method: HttpMethod,
    headers: HeaderItem[],
    body: string,
  ) {
    const trimmedUrl = url.trim();
    if (!trimmedUrl || isLoading) {
      return;
    }

    let parsedBody: unknown;
    if (method !== "GET" && body.trim().length > 0) {
      try {
        parsedBody = JSON.parse(body);
      } catch {
        setResponse(null);
        setError({
          status: 400,
          message: "O corpo da requisição contém JSON inválido.",
        });
        return;
      }
    }

    const payload: ProxyRequestPayload = {
      method,
      url: trimmedUrl,
      headers: buildHeadersRecord(headers),
      ...(parsedBody !== undefined ? { body: parsedBody } : {}),
    };

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await res.json().catch(() => null)) as
        ProxyResponse | (ProxyErrorResponse & { message?: string }) | null;

      if (!res.ok) {
        const errorMessage =
          data && "message" in data && typeof data.message === "string"
            ? data.message
            : data && "error" in data && typeof data.error === "string"
              ? data.error
              : `Erro na requisição (${res.status}).`;
        setResponse(null);
        setError({
          status: res.status,
          message: errorMessage,
        });
        return;
      }

      const proxyResponse = data as ProxyResponse;
      setResponse(proxyResponse);
      return proxyResponse;
    } catch {
      setResponse(null);
      setError({
        message: "Não foi possível conectar ao servidor proxy.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return {
    isLoading,
    response,
    error,
    request: request,
  };
}
