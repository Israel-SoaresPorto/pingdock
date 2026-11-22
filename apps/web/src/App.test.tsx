// apps/web/src/App.test.tsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import App from "./App";

describe("Página principal", () => {
  it("envia requisição GET para /api/proxy e exibe a resposta formatada", async () => {
    const user = userEvent.setup();

    const fetchMock = vi.mocked(globalThis.fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          status: 200,
          statusText: "OK",
          durationMs: 85,
          headers: { "content-type": "application/json" },
          data: { message: "pong" },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const { getByLabelText, findByText, getByText } = render(<App />);

    await user.type(
      getByLabelText("URL da requisição"),
      "https://api.exemplo.com/ping",
    );
    await user.click(screen.getByRole("button", { name: "Enviar" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/proxy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        method: "GET",
        url: "https://api.exemplo.com/ping",
        headers: { Accept: "application/json" },
      }),
    });

    expect(await findByText("200 OK")).toBeInTheDocument();
    expect(getByText("85 ms")).toBeInTheDocument();
    expect(getByText(/"message": "pong"/)).toBeInTheDocument();
  });

  it("exibe erro 400 retornado pelo proxy", async () => {
    const user = userEvent.setup();

    vi.mocked(globalThis.fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          error: "Acesso a endereços de rede privados não é permitido.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      ),
    );

    const { getByLabelText, findByRole, getByRole } = render(<App />);

    await user.type(
      getByLabelText("URL da requisição"),
      "http://127.0.0.1:3001",
    );
    await user.click(getByRole("button", { name: "Enviar" }));

    const alert = await findByRole("alert");
    expect(alert).toHaveTextContent("Requisição bloqueada");
    expect(alert).toHaveTextContent(
      "Acesso a endereços de rede privados não é permitido.",
    );
  });

  it("exibe mensagem de rate limit (429) e trata falha de rede", async () => {
    const user = userEvent.setup();

    vi.mocked(globalThis.fetch)
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            statusCode: 429,
            error: "Too Many Requests",
            message: "Limite de requisições excedido (60 por 1 minute).",
          }),
          { status: 429, headers: { "Content-Type": "application/json" } },
        ),
      )
      .mockRejectedValueOnce(new TypeError("Failed to fetch"));

    const { getByLabelText, getByRole, findByRole } = render(<App />);

    const urlInput = getByLabelText("URL da requisição");
    const submitButton = getByRole("button", { name: "Enviar" });

    await user.type(urlInput, "https://api.exemplo.com/test");
    await user.click(submitButton);

    const rateLimitAlert = await findByRole("alert");
    expect(rateLimitAlert).toHaveTextContent("Limite de requisições atingido");
    expect(rateLimitAlert).toHaveTextContent(
      "Limite de requisições excedido (60 por 1 minute).",
    );

    await user.click(submitButton);

    const networkAlert = await findByRole("alert");
    expect(networkAlert).toHaveTextContent(
      "Não foi possível conectar ao servidor proxy.",
    );
  });
});
