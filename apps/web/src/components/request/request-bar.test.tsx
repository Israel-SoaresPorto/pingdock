import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RequestBar } from "./request-bar";
import React from "react";
import type { HttpMethod } from "@/types/app";

describe("RequestBar", () => {
  it("RequestBar é renderizado corretamente", () => {
    const { getByLabelText } = render(
      <RequestBar
        isLoading={false}
        method="GET"
        url=""
        onMethodChange={vi.fn()}
        onUrlChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    const requestBar = getByLabelText("Barra de requisição");
    expect(requestBar).toBeInTheDocument();
  });

  it("envio está desabilitado quando a URL está vazia", () => {
    const { getByRole } = render(
      <RequestBar
        isLoading={false}
        method="GET"
        url=""
        onMethodChange={vi.fn()}
        onUrlChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    const submitButton = getByRole("button", { name: "Enviar" });
    expect(submitButton).toBeDisabled();
  });

  it("botão de envio é desablitado quando envio é feito", () => {
    const { getByRole } = render(
      <RequestBar
        isLoading={true}
        method="GET"
        url="https://example.com"
        onMethodChange={vi.fn()}
        onUrlChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    const submitButton = getByRole("button", { name: /Enviando/ });
    expect(submitButton).toBeDisabled();
  });

  it("envio está habilitado quando a URL não está vazia", () => {
    const { getByRole } = render(
      <RequestBar
        isLoading={false}
        method="GET"
        url="https://example.com"
        onMethodChange={vi.fn()}
        onUrlChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    const submitButton = getByRole("button", { name: "Enviar" });
    expect(submitButton).toBeEnabled();
  });

  it("requisição é feita quando o formulário é enviado", () => {
    const onSubmitMock = vi.fn();
    const { getByRole } = render(
      <RequestBar
        isLoading={false}
        method="GET"
        url="https://example.com"
        onMethodChange={vi.fn()}
        onUrlChange={vi.fn()}
        onSubmit={onSubmitMock}
      />,
    );

    const submitButton = getByRole("button", { name: "Enviar" });
    submitButton.click();

    expect(onSubmitMock).toHaveBeenCalledTimes(1);
  });

  it("habilita o botão de envio quando a URL é preenchida", async () => {
    const user = userEvent.setup();
    const onInputChangeMock = vi.fn();

    function RequestBarWrapper() {
      const [url, setUrl] = React.useState("");

      return (
        <RequestBar
          isLoading={false}
          method="GET"
          url={url}
          onMethodChange={vi.fn()}
          onUrlChange={(newUrl) => {
            setUrl(newUrl);
            onInputChangeMock(newUrl);
          }}
          onSubmit={vi.fn()}
        />
      );
    }

    const { getByRole } = render(<RequestBarWrapper />);

    const urlInput = getByRole("textbox", { name: "URL da requisição" }) as HTMLInputElement;
    const submitButton = getByRole("button", { name: "Enviar" });

    expect(submitButton).toBeDisabled();

    await user.type(urlInput, "https://example.com");

    expect(urlInput).toHaveValue("https://example.com");
    expect(submitButton).toBeEnabled();
    expect(onInputChangeMock).toHaveBeenCalled();
  });

  it("desabilita o botão de envio quando a URL é apagada", async () => {
    const user = userEvent.setup();
    const onInputChangeMock = vi.fn();

    function RequestBarWrapper() {
      const [url, setUrl] = React.useState("https://example.com");

      return (
        <RequestBar
          isLoading={false}
          method="GET"
          url={url}
          onMethodChange={vi.fn()}
          onUrlChange={(newUrl) => {
            setUrl(newUrl);
            onInputChangeMock(newUrl);
          }}
          onSubmit={vi.fn()}
        />
      );
    }

    const { getByRole } = render(<RequestBarWrapper />);

    const urlInput = getByRole("textbox", { name: "URL da requisição" }) as HTMLInputElement;
    const submitButton = getByRole("button", { name: "Enviar" });

    expect(submitButton).toBeEnabled();

    await user.clear(urlInput);

    expect(urlInput).toHaveValue("");
    expect(submitButton).toBeDisabled();
    expect(onInputChangeMock).toHaveBeenCalled();
  });

  it("altera o método HTTP quando selecionado", async () => {
    const user = userEvent.setup();
    const onMethodChangeMock = vi.fn();

    function RequestBarWrapper() {
      const [method, setMethod] = React.useState<HttpMethod>("GET");

      return (
        <RequestBar
          isLoading={false}
          method={method}
          url="https://example.com"
          onMethodChange={(newMethod) => {
            setMethod(newMethod);
            onMethodChangeMock(newMethod);
          }}
          onUrlChange={vi.fn()}
          onSubmit={vi.fn()}
        />
      );
    }

    const { getByRole, findByRole } = render(<RequestBarWrapper />);

    const methodSelect = getByRole("combobox", { hidden: true,  });
    await user.click(methodSelect);

    const postOption = await findByRole("option", { name: "POST" });
    await user.click(postOption);

    expect(methodSelect).toHaveTextContent("POST");
    expect(onMethodChangeMock).toHaveBeenCalledWith("POST");
  });
});
