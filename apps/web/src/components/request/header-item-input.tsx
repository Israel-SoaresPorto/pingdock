import { Input } from "../ui/input";
import { Button } from "../ui/button";
import type { HeaderItem } from "@/types/app";
import { cn } from "cn";
import { X } from "lucide-react";

interface HeaderItemInputProps {
  header: HeaderItem;
  index: number;
  onToggle: (id: string) => void;
  onUpdate: (id: string, field: "key" | "value", value: string) => void;
  onRemove: (id: string) => void;
}

export function HeaderItemInput({
  header,
  index,
  onToggle,
  onUpdate,
  onRemove,
}: HeaderItemInputProps) {
  return (
    <div
      key={header.id}
      className="flex flex-wrap items-center gap-2 sm:flex-nowrap"
    >
      <input
        type="checkbox"
        checked={header.enabled}
        onChange={() => onToggle(header.id)}
        aria-label={`Ativar header ${header.key || index + 1}`}
        className="size-4 shrink-0 cursor-pointer accent-primary"
      />

      <Input
        type="text"
        value={header.key}
        onChange={(event) => onUpdate(header.id, "key", event.target.value)}
        placeholder="Nome do header"
        aria-label={`Nome do header ${index + 1}`}
        disabled={!header.enabled}
        className={cn(
          "h-9 min-w-35 flex-1 rounded-[6px] px-2.5 font-mono text-sm shadow-none ",
          header.enabled && "border-border-strong bg-background text-foreground",
          !header.enabled &&
            "border-border bg-surface text-muted-foreground line-through",
        )}
      />
      <Input
        type="text"
        value={header.value}
        onChange={(event) => onUpdate(header.id, "value", event.target.value)}
        placeholder="Valor"
        aria-label={`Valor do header ${index + 1}`}
        disabled={!header.enabled}
        className={cn(
          "h-9 min-w-45 flex-[1.4] rounded-[6px] px-2.5 font-mono text-sm shadow-none ",
          header.enabled && "border-border-strong bg-background text-foreground",
          !header.enabled &&
            "border-border bg-surface text-muted-foreground line-through",
        )}
      />
      <Button
        type="button"
        variant="secondary"
        onClick={() => onRemove(header.id)}
        aria-label={`Remover header ${header.key || index + 1}`}
        className="h-8 w-8 shrink-0 rounded-[6px] p-0 text-muted-foreground hover:bg-surface hover:text-foreground cursor-pointer"
      >
        <X className="size-4" />
      </Button>
    </div>
  );
}
