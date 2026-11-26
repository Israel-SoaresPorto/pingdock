// apps/web/src/components/HistorySidebar.test.tsx
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { HistoryItem } from "@/types/app";
import { HistorySidebar } from "./history-sidebar";

const sampleItems: HistoryItem[] = [
  {
    id: "req-1",
    method: "POST",
    url: "https://api.exemplo.com/v1/posts",
    headers: [
      {
        id: "h-1",
        key: "Content-Type",
        value: "application/json",
        enabled: true,
      },
    ],
    body: '{"title":"Teste"}',
    status: 201,
    durationMs: 245,
    timestamp: 1700000000000,
  },
  {
    id: "req-2",
    method: "GET",
    url: "https://api.exemplo.com/v1/not-found",
    headers: [],
    body: "",
    status: 404,
    durationMs: 92,
    timestamp: 1699999900000,
  },
];

describe("HistorySidebar", () => {
  it("exibe estado vazio quando não há requisições salvas", () => {
    const { getByText, getByRole } = render(
      <HistorySidebar
        items={[]}
        selectedId={null}
        onSelect={vi.fn()}
        onRemove={vi.fn()}
        onClear={vi.fn()}
      />,
    );

    expect(getByText("0/50")).toBeInTheDocument();
    expect(getByText("Nenhuma requisição ainda")).toBeInTheDocument();
    expect(
      getByText(
        "Envie a primeira e ela aparece aqui. O histórico fica salvo neste navegador.",
      ),
    ).toBeInTheDocument();
    expect(getByRole("button", { name: "Limpar tudo" })).toBeDisabled();
  });

  it("renderiza itens com método, host/caminho, status semântico e marca item ativo", () => {
    const { getByText, getByRole } = render(
      <HistorySidebar
        items={sampleItems}
        selectedId="req-1"
        onSelect={vi.fn()}
        onRemove={vi.fn()}
        onClear={vi.fn()}
      />,
    );

    expect(getByText("2/50")).toBeInTheDocument();
    expect(getByText("POST")).toBeInTheDocument();
    expect(getByText("api.exemplo.com/v1/posts")).toBeInTheDocument();

    const successBadge = getByText("201");
    expect(successBadge).toHaveClass(
      "bg-status-success-bg",
      "text-status-success-text",
    );

    const warningBadge = getByText("404");
    expect(warningBadge).toHaveClass(
      "bg-status-warning-bg",
      "text-status-warning-text",
    );

    const activeButton = getByRole("button", { current: true });
    expect(activeButton).toHaveAttribute("aria-current", "true");
  });

  it("aciona onSelect ao clicar em um item do histórico", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    const { getByRole } = render(
      <HistorySidebar
        items={sampleItems}
        selectedId={null}
        onSelect={onSelect}
        onRemove={vi.fn()}
        onClear={vi.fn()}
      />,
    );

    await user.click(
      getByRole("button", {
        name: /^POST201 api\.exemplo\.com\/v1\/posts/,
      }),
    );

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(sampleItems[0]);
  });

  it("aciona onRemove para item específico e onClear para limpar tudo", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    const onClear = vi.fn();

    const { getByRole } = render(
      <HistorySidebar
        items={sampleItems}
        selectedId={null}
        onSelect={vi.fn()}
        onRemove={onRemove}
        onClear={onClear}
      />,
    );

    await user.click(
      getByRole("button", {
        name: "Remover requisição POST api.exemplo.com/v1/posts",
      }),
    );
    expect(onRemove).toHaveBeenCalledWith("req-1");

    await user.click(getByRole("button", { name: "Limpar tudo" }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
