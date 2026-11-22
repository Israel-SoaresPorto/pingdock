import { useState } from "react";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { HeaderItem, HttpMethod } from "@/types/app";
import { RequestTabs } from "./request-tabs";

function TabsHarness({
  initialMethod = "POST",
  initialHeaders = [
    { id: "1", key: "Content-Type", value: "application/json", enabled: true },
  ],
  initialBody = "",
}: {
  initialMethod?: HttpMethod;
  initialHeaders?: HeaderItem[];
  initialBody?: string;
}) {
  const [headers, setHeaders] = useState(initialHeaders);
  const [body, setBody] = useState(initialBody);

  return (
    <RequestTabs
      method={initialMethod}
      headers={headers}
      body={body}
      onHeadersChange={setHeaders}
      onBodyChange={setBody}
    />
  );
}

describe("RequestTabs", () => {
  it("adiciona, alterna e remove headers dinamicamente", async () => {
    const user = userEvent.setup();
    const { getByLabelText, getByRole, queryByDisplayValue } = render(
      <TabsHarness />,
    );

    expect(getByLabelText(/nome do header 1/i)).toHaveValue("Content-Type");

    await user.click(getByRole("button", { name: /adicionar header/i }));
    expect(getByLabelText(/nome do header 2/i)).toBeInTheDocument();

    const checkbox = getByLabelText(/ativar header content-type/i);
    await user.click(checkbox);
    expect(checkbox).not.toBeChecked();
    expect(getByLabelText(/nome do header 1/i)).toHaveClass("line-through");

    await user.click(getByLabelText(/remover header content-type/i));
    expect(queryByDisplayValue("Content-Type")).not.toBeInTheDocument();
  });

  it("desabilita o campo Body quando o método é GET", async () => {
    const user = userEvent.setup();
    const { getByRole, getByText, getByLabelText } = render(<TabsHarness initialMethod="GET" />);

    await user.click(getByRole("tab", { name: /body/i }));

    expect(
      getByText(/requisições get não enviam corpo/i),
    ).toBeInTheDocument();
    expect(getByLabelText(/corpo json da requisição/i)).toBeDisabled();
  });

  it("exibe alerta visual quando o JSON é inválido em métodos com body", async () => {
    const user = userEvent.setup();
    const { getByRole, getByLabelText } = render(
      <RequestTabs
        method="POST"
        headers={[]}
        body="{ invalido"
        onHeadersChange={vi.fn()}
        onBodyChange={vi.fn()}
      />,
    );

    await user.click(getByRole("tab", { name: /body/i }));

    const textarea = getByLabelText(/corpo json da requisição/i);
    expect(textarea).toHaveAttribute("aria-invalid", "true");
    expect(getByRole("alert")).toHaveTextContent(/json inválido/i);
  });
});
