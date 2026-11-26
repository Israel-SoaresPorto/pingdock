import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ProxyResponse } from "@/types/api";
import { ResponsePanel, ResponsePanelEmpty } from "./response-panel";

function createResponse(overrides: Partial<ProxyResponse> = {}): ProxyResponse {
  return {
    status: 200,
    statusText: "OK",
    durationMs: 142,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "x-request-id": "req-123",
    },
    data: { ok: true, items: [1, 2] },
    ...overrides,
  };
}

describe("ResponsePanelEmpty", () => {
  it("renderiza estado vazio com mensagem padrão", () => {
    const { getByText } = render(<ResponsePanelEmpty />);

    expect(
      getByText(/Envie uma requisição para ver a resposta aqui/i),
    ).toBeInTheDocument();
  });

  it("renderiza estado vazio com conteúdo personalizado", () => {
    const customMessage = "Mensagem personalizada";
    const { getByText } = render(
      <ResponsePanelEmpty>
        {customMessage}
      </ResponsePanelEmpty>,
    );

    expect(getByText(customMessage)).toBeInTheDocument();
  });
});

describe("ResponsePanel", () => {
  it("renderiza estado vazio inicial quando não há resposta nem erro", () => {
    const { getByText } = render(
      <ResponsePanel response={null} error={null} isLoading={false} />,
    );

    expect(getByText(/Nenhuma resposta ainda/)).toBeInTheDocument();
  });

  it("renderiza estado de carregamento quando isLoading é true", () => {
    const { getByText } = render(
      <ResponsePanel response={null} error={null} isLoading={true} />,
    );

    expect(getByText("Enviando requisição…")).toBeInTheDocument();
  });

  it.each([
    {
      status: 400,
      expectedTitle: "Requisição bloqueada",
      expectedMessage: "Acesso a endereços de rede privados não é permitido.",
    },
    {
      status: 429,
      expectedTitle: "Limite de requisições atingido",
      expectedMessage: "Limite de requisições excedido.",
    },
    {
      status: 504,
      expectedTitle: "Tempo limite excedido",
      expectedMessage: "O servidor não respondeu a tempo.",
    },
  ])(
    "renderiza estado de erro para status $status",
    ({ status, expectedTitle, expectedMessage }) => {
      const error = { status, message: expectedMessage };

      const { getByText } = render(
        <ResponsePanel response={null} error={error} isLoading={false} />,
      );

      expect(getByText(expectedTitle)).toBeInTheDocument();
      expect(getByText(expectedMessage)).toBeInTheDocument();
    }
  );
    
  it("formata JSON com 2 espaços e preserva texto puro", () => {
    const { rerender, getByText } = render(
      <ResponsePanel
        response={createResponse({ data: { hello: "world" } })}
        error={null}
        isLoading={false}
      />,
    );

    const pre = getByText((content, element) => {
      return element?.tagName === "PRE" && content.includes('"hello": "world"');
    });
    expect(pre.textContent).toBe('{\n  "hello": "world"\n}');

    rerender(
      <ResponsePanel
        response={createResponse({ data: "linha 1\nlinha 2" })}
        error={null}
        isLoading={false}
      />,
    );

    expect(
      getByText((_, element) => {
        return (
          element?.tagName === "PRE" &&
          element.textContent === "linha 1\nlinha 2"
        );
      }),
    ).toBeInTheDocument();
  });
});
