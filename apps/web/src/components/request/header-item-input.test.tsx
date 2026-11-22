import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { HeaderItemInput } from "./header-item-input";

describe("HeaderItemInput", () => {
  const mockOnToggle = vi.fn();
  const mockOnUpdate = vi.fn();
  const mockOnRemove = vi.fn();

  it("altera o estado do header ao clicar no checkbox", async () => {
    const { getByRole } = render(
      <HeaderItemInput
        header={{
          id: "1",
          key: "Content-Type",
          value: "application/json",
          enabled: true,
        }}
        index={0}
        onToggle={mockOnToggle}
        onUpdate={mockOnUpdate}
        onRemove={mockOnRemove}
      />,
    );

    const checkbox = getByRole("checkbox", { name: /Ativar header Content-Type/ });
    await userEvent.click(checkbox);
    expect(mockOnToggle).toHaveBeenCalledWith("1");
  });

  it("altera o valor do header ao fazer input", async () => {
    const { getByRole } = render(
      <HeaderItemInput
        header={{
          id: "1",
          key: "Content-Type",
          value: "application/json",
          enabled: true,
        }}
        index={0}
        onToggle={mockOnToggle}
        onUpdate={mockOnUpdate}
        onRemove={mockOnRemove}
      />
    );

    const inputHeaderKey = getByRole("textbox", { name: /Nome do header 1/ });
    const inputHeaderValue = getByRole("textbox", { name: /Valor do header 1/ });
    
    await userEvent.type(inputHeaderKey, "Accept");
    expect(mockOnUpdate).toHaveBeenCalled();
    
    await userEvent.type(inputHeaderValue, "application/xml");
    expect(mockOnUpdate).toHaveBeenCalled();
  });

  it("remove header ao clicar no botão de remover", async () => {
    const { getByRole } = render(
      <HeaderItemInput
        header={{
          id: "1",
          key: "Content-Type",
          value: "application/json",
          enabled: true,
        }}
        index={0}
        onToggle={mockOnToggle}
        onUpdate={mockOnUpdate}
        onRemove={mockOnRemove}
      />,
    );

    const removeButton = getByRole("button", { name: /Remover header Content-Type/ });
    await userEvent.click(removeButton);
    expect(mockOnRemove).toHaveBeenCalledWith("1");
  });

  it("renderiza headers desabilitados", async () => {
    const { getByRole } = render(
      <HeaderItemInput
        header={{
          id: "1",
          key: "Content-Type",
          value: "application/json",
          enabled: false,
        }}
        index={0}
        onToggle={mockOnToggle}
        onUpdate={mockOnUpdate}
        onRemove={mockOnRemove}
      />,
    );

    const input = getByRole("textbox", { name: /Nome do header 1/ });
    expect(input).toBeDisabled();
  });
});
