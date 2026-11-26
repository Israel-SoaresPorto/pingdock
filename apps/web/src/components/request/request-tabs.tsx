import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Textarea } from "../ui/textarea";
import type { HeaderItem, HttpMethod } from "@/types/app";
import { isValidJson } from "@/lib/utils";
import { HeaderItemInput } from "./header-item-input";
import { useCallback } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface RequestTabsProps {
  method: HttpMethod;
  headers: HeaderItem[];
  body: string;
  onHeadersChange: (headers: HeaderItem[]) => void;
  onBodyChange: (body: string) => void;
  className?: string;
}

export function RequestTabs({
  method,
  headers,
  body,
  onHeadersChange,
  onBodyChange,
  className,
}: RequestTabsProps) {
  const isGetMethod = method === "GET";
  const activeHeadersCount = headers.filter(
    (h) => h.enabled && h.key.trim().length > 0,
  ).length;
  const hasJsonError = !isGetMethod && !isValidJson(body);

  function handleAddHeader() {
    onHeadersChange([
      ...headers,
      {
        id: crypto.randomUUID(),
        key: "",
        value: "",
        enabled: true,
      },
    ]);
  }

  const handleToggleHeader = useCallback(
    (id: string) => {
      onHeadersChange(
        headers.map((item) =>
          item.id === id ? { ...item, enabled: !item.enabled } : item,
        ),
      );
    },
    [headers, onHeadersChange],
  );

  const handleUpdateHeader = useCallback(
    (id: string, field: "key" | "value", value: string) => {
      onHeadersChange(
        headers.map((item) =>
          item.id === id ? { ...item, [field]: value } : item,
        ),
      );
    },
    [headers, onHeadersChange],
  );

  const handleRemoveHeader = useCallback(
    (id: string) => {
      onHeadersChange(headers.filter((item) => item.id !== id));
    },
    [headers, onHeadersChange],
  );

  return (
    <Tabs defaultValue="headers" className={className}>
      <TabsList
        className="w-full justify-start rounded-none border-b border-border bg-transparent p-1"
        variant="line"
      >
        <TabsTrigger
          value="headers"
          className="py-2 px-4 grow-0 data-active:after:bg-primary"
        >
          Headers
          <span className="ml-2 font-mono text-sm text-muted-foreground">
            {activeHeadersCount}
          </span>
        </TabsTrigger>

        <TabsTrigger
          value="body"
          className="py-2 px-4 rounded-none border-b-2 grow-0 bg-transparent text-sm font-normal text-muted-foreground shadow-none data-active:after:bg-primary"
        >
          Body
        </TabsTrigger>
      </TabsList>

      <TabsContent value="headers" className="mt-4 space-y-2 px-2">
        {headers.map((header, index) => {
          return (
            <HeaderItemInput
              key={header.id}
              header={header}
              index={index}
              onToggle={handleToggleHeader}
              onUpdate={handleUpdateHeader}
              onRemove={handleRemoveHeader}
            />
          );
        })}

        <Button
          type="button"
          variant="outline"
          onClick={handleAddHeader}
          className="h-8 rounded-[6px] border-dashed border-border-strong bg-surface px-2.5 text-sm font-medium text-foreground shadow-none hover:bg-surface/80"
        >
          <Plus className="mr-2 size-3.5" />
          Adicionar header
        </Button>
      </TabsContent>

      <TabsContent value="body" className="mt-4 space-y-2">
        {isGetMethod && (
          <p className="text-sm text-muted-foreground">
            Requisições GET não enviam corpo. Troque o método para habilitar.
          </p>
        )}

        <Textarea
          value={body}
          onChange={(event) => onBodyChange(event.target.value)}
          disabled={isGetMethod}
          placeholder='{ "chave": "valor" }'
          aria-label="Corpo JSON da requisição"
          aria-invalid={hasJsonError}
          rows={8}
          className={cn(
            "w-full resize-y rounded-md p-3 font-mono text-sm leading-[1.6] shadow-none",
            isGetMethod
              ? "min-h-40 resize-y rounded-md border-dashed border-border-strong bg-surface p-3 font-mono text-sm leading-[1.6] text-muted-foreground shadow-none disabled:cursor-not-allowed disabled:opacity-100"
              : `min-h-40 resize-y rounded-md bg-background p-3 font-mono text-sm leading-[1.6] text-foreground shadow-none`,
            hasJsonError
              ? "border-destructive text-destructive"
              : "border-border",
          )}
        />

        {hasJsonError && (
          <p role="alert" className="text-sm text-destructive">
            JSON inválido. Verifique a sintaxe antes de enviar.
          </p>
        )}
      </TabsContent>
    </Tabs>
  );
}
