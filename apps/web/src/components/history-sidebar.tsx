import {
  formatHostAndPath,
  getStatusBadgeClass,
  formatHistoryTimestamp,
} from "@/lib/utils";
import type { HistoryItem } from "@/types/app";
import { Button } from "./ui/button";
import { cn } from "cn";
import { Clock, Trash2 } from "lucide-react";
import { MAX_HISTORY_ITEMS } from "@/types/app";

interface HistorySidebarProps {
  items: HistoryItem[];
  selectedId: string | null;
  onSelect: (item: HistoryItem) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}

export function HistorySidebar({
  items,
  selectedId,
  onSelect,
  onRemove,
  onClear,
}: HistorySidebarProps) {
  const isEmpty = items.length === 0;
  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-foreground">Histórico</h2>
          <span className="font-mono text-xs text-muted-foreground">
            {items.length}/{MAX_HISTORY_ITEMS}
          </span>
        </div>
        <Button
          type="button"
          variant="ghost"
          onClick={onClear}
          disabled={isEmpty}
          className="h-11 rounded-sm px-2.5 text-xs font-medium text-muted-foreground shadow-none hover:bg-background hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-50 lg:h-8"
        >
          Limpar tudo
        </Button>
      </div>
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border p-6 text-center">
          <Clock
            className="size-5 text-muted-foreground"
            strokeWidth={1.5}
            aria-hidden="true"
          />
          <p className="text-sm font-medium text-foreground">
            Nenhuma requisição ainda
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Envie a primeira e ela aparece aqui. O histórico fica salvo neste
            navegador.
          </p>
        </div>
      ) : (
        <ul className="space-y-1.5 flex-1 overflow-y-auto" aria-label="Requisições salvas">
          {items.map((item) => {
            const isSelected = item.id === selectedId;
            const displayUrl = formatHostAndPath(item.url);
            return (
              <li
                key={item.id}
                className={cn(
                  "flex items-start gap-1.5 rounded-[6px] border p-1 transition-colors",
                  isSelected
                    ? "border-border bg-surface-selected text-foreground"
                    : "border-transparent bg-surface text-foreground hover:border-border hover:bg-background",
                )}
              >
                <button
                  type="button"
                  onClick={() => onSelect(item)}
                  aria-current={isSelected ? "true" : undefined}
                  title={item.url}
                  className="min-w-0 flex-1 cursor-pointer rounded-sm p-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-2xs font-semibold text-foreground">
                      {item.method}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-sm px-1.5 py-0.5 font-mono text-xs font-medium",
                        getStatusBadgeClass(item.status),
                      )}
                    >
                      {item.status}
                    </span>
                  </div>
                  <p className="mt-1 truncate font-mono text-xs text-foreground">
                    {displayUrl}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.durationMs} ms ·{" "}
                    {formatHistoryTimestamp(item.timestamp)}
                  </p>
                </button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onRemove(item.id)}
                  aria-label={`Remover requisição ${item.method} ${displayUrl}`}
                  className="mt-0.5 size-11 shrink-0 cursor-pointer rounded-sm p-0 text-muted-foreground shadow-none hover:bg-background hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface lg:size-8"
                >
                  <Trash2
                    className="size-4"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
