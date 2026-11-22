import { cn } from "@/lib/utils";
import type { ProxyResponse } from "@/types/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

interface ResponseContentProps {
  response: ProxyResponse;
}

function getStatusBadgeClass(status: number): string {
  if (status >= 200 && status < 300) {
    return "bg-status-success-bg text-status-success-text";
  }
  if (status >= 300 && status < 400) {
    return "bg-status-info-bg text-status-info-text";
  }
  if (status >= 400 && status < 500) {
    return "bg-status-warning-bg text-status-warning-text";
  }
  return "bg-status-error-bg text-status-error-text";
}

function formatResponseBody(data: unknown): string | null {
  if (data === null || data === undefined) {
    return null;
  }

  if (typeof data === "string") {
    return data.length > 0 ? data : null;
  }

  return JSON.stringify(data, null, 2);
}

export function ResponseContent({ response }: ResponseContentProps) {
  const formattedBody = formatResponseBody(response.data);
  const headerEntries = Object.entries(response.headers);
  const statusLabel = response.statusText
    ? `${response.status} ${response.statusText}`
    : String(response.status);

  return (
    <section aria-label="Painel de resposta" className="space-y-4">
      <Tabs defaultValue="body" className="w-full gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-sm font-semibold text-foreground">Resposta</h2>

            <span
              className={cn(
                "inline-flex items-center rounded-sm px-2 py-0.5 font-mono text-2xs font-medium",
                getStatusBadgeClass(response.status),
              )}
            >
              {statusLabel}
            </span>

            <span className="font-mono text-2xs font-medium text-muted-foreground">
              {response.durationMs} ms
            </span>
          </div>

          <TabsList className="h-8 rounded-sm border border-border bg-surface p-0.5">
            <TabsTrigger
              value="body"
              className="h-7 rounded-sm px-3 text-2xs font-medium text-muted-foreground shadow-none data-active:border data-active:border-border data-active:bg-background data-active:text-foreground data-active:shadow-none dark:data-active:bg-[#1a1a1a]"
            >
              Corpo
            </TabsTrigger>
            <TabsTrigger
              value="headers"
              className="h-7 rounded-sm px-3 text-2xs font-medium text-muted-foreground shadow-none data-active:border data-active:border-border data-active:bg-background data-active:text-foreground data-active:shadow-none dark:data-active:bg-[#1a1a1a]"
            >
              Headers
              <span className="ml-1.5 font-mono text-2xs text-muted-foreground">
                {headerEntries.length}
              </span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="body" className="mt-0">
          {formattedBody !== null ? (
            <pre className="overflow-x-auto h-full max-h-80 whitespace-pre-wrap wrap-break-word rounded-md border border-border bg-surface p-4 font-mono text-2xs leading-[1.6] text-foreground">
              {formattedBody}
            </pre>
          ) : (
            <div className="rounded-md border border-border bg-surface p-4 text-2xs text-muted-foreground">
              Sem conteúdo no corpo da resposta.
            </div>
          )}
        </TabsContent>

        <TabsContent value="headers" className="mt-0">
          {headerEntries.length > 0 ? (
            <div className="overflow-x-auto rounded-md border border-border bg-surface h-full max-h-80">
              <dl className="divide-y divide-border">
                {headerEntries.map(([key, value]) => (
                  <div
                    key={key}
                    className="grid grid-cols-1 gap-1 px-4 py-2.5 sm:grid-cols-[minmax(160px,1fr)_2fr] sm:gap-4"
                  >
                    <dt className="font-mono text-2xs text-muted-foreground break-all">
                      {key}
                    </dt>
                    <dd className="font-mono text-2xs text-foreground break-all">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : (
            <div className="rounded-md border border-border bg-surface p-4 text-2xs text-muted-foreground">
              Nenhum header retornado pela resposta.
            </div>
          )}
        </TabsContent>
      </Tabs>
    </section>
  );
}
