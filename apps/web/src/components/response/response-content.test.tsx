import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResponseContent } from "./response-content";

describe("ResponseContent", () => {
  const mockResponse = {
    status: 200,
    statusText: "OK",
    durationMs: 123,
    data: { message: "Hello, World!" },
    headers: {
      "Content-Type": "application/json",
      "X-Custom-Header": "CustomValue",
    },
  };

  it("alterna entre as abas de corpo e headers", async () => {
    const user = userEvent.setup();

    const { getByRole, getByText } = render(
      <ResponseContent response={mockResponse} />,
    );

    const bodyTab = getByRole("tab", { name: /corpo/i });
    const headersTab = getByRole("tab", { name: /headers/i });

    // Verifica se a aba de corpo está ativa inicialmente
    expect(bodyTab).toHaveAttribute("aria-selected", "true");
    expect(getByText(/hello, world!/i)).toBeInTheDocument();

    // Alterna para a aba de headers
    await user.click(headersTab);

    // Verifica se a aba de headers está ativa
    expect(headersTab).toHaveAttribute("aria-selected", "true");
    expect(getByText(/content-type/i)).toBeInTheDocument();
    expect(getByText(/x-custom-header/i)).toBeInTheDocument();
  });

  it("exibe o status, statusText e duração da resposta", () => {
    const { getByText } = render(<ResponseContent response={mockResponse} />);

    expect(getByText(/200 OK/i)).toBeInTheDocument();
    expect(getByText(/123 ms/i)).toBeInTheDocument();
  });

  it.each([
    { status: 200, expectedClass: "bg-status-success-bg" },
    { status: 301, expectedClass: "bg-status-info-bg" },
    { status: 404, expectedClass: "bg-status-warning-bg" },
    { status: 500, expectedClass: "bg-status-error-bg" },
  ])(
    "aplica a classe correta para o status $status",
    ({ status, expectedClass }) => {
      const responseWithStatus = { ...mockResponse, status };
      const { getByText } = render(
        <ResponseContent response={responseWithStatus} />,
      );

      expect(getByText(new RegExp(`${status}`, "i"))).toHaveClass(expectedClass);
    },
  );

  it("exibe uma mensagem quando não há corpo na resposta", () => {
    const responseWithoutBody = { ...mockResponse, data: null };
    const { getByText } = render(
      <ResponseContent response={responseWithoutBody} />,
    );

    expect(getByText(/sem conteúdo no corpo da resposta/i)).toBeInTheDocument();
  });

  it("exibe uma mensagem quando não há headers na resposta", async() => {
    const responseWithoutHeaders = { ...mockResponse, headers: {} };
    const { getByText } = render(
      <ResponseContent response={responseWithoutHeaders} />,
    );

    // Alterna para a aba de headers
    const headersTab = getByText(/headers/i);
    await userEvent.click(headersTab);

    expect(getByText(/nenhum header/i)).toBeInTheDocument();
  });

  it("exibe o número correto de headers na aba de headers", async () => {
    const user = userEvent.setup();
    const { getByText, getAllByRole } = render(<ResponseContent response={mockResponse} />);

    const headersTab = getByText(/headers/i);

    await user.click(headersTab);

    const headers = getAllByRole("term");
    expect(headers.length).toBe(2);
  });
});
